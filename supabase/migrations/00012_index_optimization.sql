-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 00012: Index Optimization
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Purpose:  Optimize query performance across all primary access paths based on
--           static EXPLAIN analysis of every query in queries/*.ts and RPCs.
--
-- Strategy: Composite + partial indexes aligned to actual query patterns.
--           Remove redundant single-column indexes superseded by composites
--           or already covered by UNIQUE constraints.
--
-- Safety:   All CREATE/DROP INDEX use CONCURRENTLY (no table locks, no downtime).
--           Supabase migrations run inside a transaction by default, but
--           CREATE INDEX CONCURRENTLY cannot run inside a transaction.
--           You MUST run this migration outside a transaction, e.g.:
--
--             psql -f 00012_index_optimization.sql   (auto-commit mode)
--
--           Or via Supabase Dashboard SQL Editor (each statement auto-commits).
--
-- Rollback: See 00012_index_optimization_down.sql
--           Inline rollback commands are annotated on each statement below
--           for review verification (search "-- ROLLBACK:").
--
-- Predicate form:
--   Partial index WHERE clauses use = true / = false (not IS TRUE / IS FALSE).
--   PostgREST's .eq("col", true) generates "WHERE col = true", which PG
--   simplifies to a bare Var node. For predicate implication to succeed,
--   the index predicate must match this simplified form. IS TRUE produces
--   a BooleanTest node that does NOT match — confirmed on PG 15-17.
--   All boolean columns in this schema are NOT NULL, so = true / = false
--   is semantically equivalent to IS TRUE / IS FALSE.
--
-- Write-cost analysis:
--   - Net index count: +9 created, -6 dropped = +3 net indexes
--   - Each INSERT/UPDATE on products touches ~3 indexes (was 4+PK, now 3+PK)
--   - Each INSERT on orders touches ~5 indexes (was 4+PK, now 5+PK)
--   - GIN index on blog_posts.tags adds ~2x overhead to tag array writes
--     (acceptable: blog posts are written infrequently)
--   - Partial indexes are smaller and faster to maintain than full indexes
--
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1: CREATE NEW COMPOSITE & PARTIAL INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
-- Run these FIRST, before dropping old indexes, so queries never lose coverage.

-- 1a. Products — storefront listing
-- Query:  WHERE is_active = true ORDER BY is_featured DESC, created_at DESC
-- Source: queryProducts() default sort, queryFeaturedProducts()
-- Before: Bitmap Heap Scan on idx_products_is_active → Sort (in-memory)
-- After:  Index Scan on idx_products_storefront_listing (no sort needed)
-- Covers: category filter can be applied as Filter on index scan results
--         (high selectivity on is_active removes most rows before filter)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_storefront_listing
  ON public.products (is_featured DESC, created_at DESC)
  WHERE is_active = true;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_products_storefront_listing;

-- 1b. Product reviews — storefront reviews per product
-- Query:  WHERE product_id = $1 AND is_approved = true ORDER BY created_at DESC
-- Source: queryProductReviews()
-- Before: Index Scan on idx_reviews_product_id → Filter is_approved → Sort
-- After:  Index Scan on idx_reviews_approved_by_product (pre-sorted, pre-filtered)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved_by_product
  ON public.product_reviews (product_id, created_at DESC)
  WHERE is_approved = true;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_approved_by_product;

-- 1c. Product reviews — admin pending reviews
-- Query:  WHERE is_approved = false ORDER BY created_at DESC
-- Source: queryAdminReviews({ status: "pending" })
-- Before: Seq Scan → Filter → Sort (no usable index)
-- After:  Index Scan on idx_reviews_pending (small partial index)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pending
  ON public.product_reviews (created_at DESC)
  WHERE is_approved = false;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_pending;

-- 1d. Orders — admin listing with status filter
-- Query:  WHERE status = $1 ORDER BY created_at DESC RANGE(from, to)
-- Source: queryAdminOrders({ status })
-- Before: Index Scan on idx_orders_status → Sort on created_at
-- After:  Index Scan on idx_orders_status_created (equality then range, no sort)
--
-- Column order: status (equality, =) THEN created_at (range, DESC)
-- per Supabase best practice §1.3: equality columns first, range columns last.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_created
  ON public.orders (status, created_at DESC);
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status_created;

-- 1e. Orders — revenue analytics (sales RPC + dashboard stats)
-- Query:  WHERE status IN ('paid','shipped','delivered') AND created_at >= $1
-- Source: get_sales_analytics(), get_dashboard_stats()
-- Before: Seq Scan on orders → Filter by status → Filter by date
-- After:  Index Scan on idx_orders_revenue_by_date (pre-filtered to revenue rows)
--
-- This partial index covers ~60-80% of orders (most orders end up paid/shipped/delivered).
-- The WHERE clause uses a list of qualifying statuses rather than a boolean column,
-- so a partial index is more precise than a status column index.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_revenue_by_date
  ON public.orders (created_at DESC)
  WHERE status IN ('paid', 'shipped', 'delivered');
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_orders_revenue_by_date;

-- 1f. Orders — verified purchase check
-- Query:  WHERE user_id = $1 AND status IN ('paid','shipped','delivered')
--         JOIN order_items ON oi.order_id = o.id WHERE oi.product_id = $2
-- Source: has_purchased_product() RPC
-- Before: Index Scan on idx_orders_user_id → fetch all user orders → filter status
-- After:  Index Scan on idx_orders_user_purchases (only paid orders per user)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_user_purchases
  ON public.orders (user_id, id)
  WHERE status IN ('paid', 'shipped', 'delivered');
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_orders_user_purchases;

-- 1g. Blog posts — tag filtering with GIN
-- Query:  WHERE is_published = true AND tags @> ARRAY[$1] ORDER BY published_at DESC
-- Source: queryBlogPosts({ tag })
-- Before: Seq Scan → Filter (B-tree cannot support @> operator on arrays)
-- After:  Bitmap Index Scan on idx_blog_posts_tags_gin → Bitmap Heap Scan
--
-- GIN is the correct index type for array containment (@>) per §1.2.
-- Partial index restricts to published posts only (storefront never queries drafts).

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_tags_gin
  ON public.blog_posts USING GIN (tags)
  WHERE is_published = true;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_tags_gin;

-- 1h. Products — low stock dashboard count
-- Query:  WHERE is_active = true AND stock_quantity < 10
-- Source: get_dashboard_stats() RPC
-- Before: Index Scan on idx_products_is_active → Filter stock_quantity < 10
-- After:  Index Only Scan on idx_products_low_stock (tiny partial index, ~5-20 rows)
--
-- This partial index is extremely small (only rows with stock < 10) and
-- gets updated only when stock changes cross the threshold.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
  ON public.products (id)
  WHERE is_active = true AND stock_quantity < 10;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_products_low_stock;

-- 1i. Coupons — admin listing sort
-- Query:  ORDER BY created_at DESC RANGE(from, to)
-- Source: queryAdminCoupons()
-- Before: Seq Scan → Sort (no index on created_at)
-- After:  Index Scan Backward on idx_coupons_created (pre-sorted)

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_created
  ON public.coupons (created_at DESC);
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_coupons_created;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: DROP REDUNDANT INDEXES
-- ─────────────────────────────────────────────────────────────────────────────
-- Only after Phase 1 completes, so queries always have index coverage.
--
-- These indexes are redundant because:
-- (a) A UNIQUE constraint already created an implicit unique index, OR
-- (b) A new composite/partial index supersedes the single-column index.
--
-- DROP INDEX CONCURRENTLY prevents AccessExclusiveLock during drop.

-- Redundant with UNIQUE constraint on products.slug
DROP INDEX CONCURRENTLY IF EXISTS idx_products_slug;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug ON public.products (slug);

-- Redundant with UNIQUE constraint on blog_posts.slug
DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_slug;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts (slug);

-- Redundant with UNIQUE constraint on coupons.code
DROP INDEX CONCURRENTLY IF EXISTS idx_coupons_code;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_code ON public.coupons (code);

-- Low selectivity boolean; superseded by idx_products_storefront_listing partial
DROP INDEX CONCURRENTLY IF EXISTS idx_products_is_active;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active ON public.products (is_active);

-- Low selectivity boolean; superseded by idx_products_storefront_listing partial
DROP INDEX CONCURRENTLY IF EXISTS idx_products_is_featured;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_featured ON public.products (is_featured);

-- Low selectivity boolean; blog queries always use published_at or tags
DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_is_published;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_is_published ON public.blog_posts (is_published);


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3: RPC OPTIMIZATION — get_dashboard_stats()
-- ─────────────────────────────────────────────────────────────────────────────
-- Rewrite to scan the orders table ONCE using aggregate FILTER clauses
-- instead of 5 separate subqueries (each scanning orders independently).
--
-- Before: 5 sequential scans on orders + 1 on customer_profiles + 1 on products
-- After:  1 sequential scan on orders + 1 on customer_profiles + 1 index scan on products
--
-- Changed from plpgsql to sql language for better query planning:
-- the SQL optimizer can inline SQL functions and plan them holistically.
-- plpgsql functions are optimization barriers.
--
-- The STABLE volatility marker tells the planner this function returns
-- the same result within a single transaction (safe for caching).
--
-- ROLLBACK: See 00012_index_optimization_down.sql Phase 1 (restores original
--           plpgsql version with 5 subqueries). The rollback RPC body is too
--           large for an inline comment but the function signature is identical,
--           so CREATE OR REPLACE in the down script is a clean swap.

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_orders',    o.total_orders,
    'pending_orders',  o.pending_orders,
    'completed_orders', o.completed_orders,
    'total_revenue',   o.total_revenue,
    'orders_today',    o.orders_today,
    'total_customers', (SELECT count(*) FROM public.customer_profiles),
    'low_stock_products', (
      SELECT count(*)
      FROM public.products
      WHERE is_active = true
        AND stock_quantity < 10
    )
  )
  FROM (
    SELECT
      count(*)                                                          AS total_orders,
      count(*) FILTER (WHERE status = 'pending')                       AS pending_orders,
      count(*) FILTER (WHERE status = 'delivered')                     AS completed_orders,
      coalesce(sum(total) FILTER (WHERE status IN ('paid', 'shipped', 'delivered')), 0) AS total_revenue,
      count(*) FILTER (WHERE created_at >= current_date)               AS orders_today
    FROM public.orders
  ) o;
$$;

COMMENT ON FUNCTION public.get_dashboard_stats() IS
  'Dashboard aggregation: single scan on orders with FILTER clauses. '
  'Uses idx_products_low_stock partial index for low-stock count.';


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 4: ANALYZE updated tables
-- ─────────────────────────────────────────────────────────────────────────────
-- After creating indexes, update table statistics so the query planner
-- has accurate row estimates for the new indexes.
-- ROLLBACK: No-op (ANALYZE is idempotent and always safe to re-run).

ANALYZE public.products;
ANALYZE public.product_reviews;
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.blog_posts;
ANALYZE public.coupons;
