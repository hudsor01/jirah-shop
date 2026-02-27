-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration 00013: Index Predicate Fix + Housekeeping
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Purpose:  Fix 5 partial indexes from migration 00012 that used IS TRUE / IS FALSE
--           predicates. PG simplifies "col = true" (what PostgREST generates) to a
--           bare Var node, which does NOT match IS TRUE (BooleanTest node) during
--           predicate implication. Result: indexes were invisible to application queries.
--
--           Also drops redundant idx_orders_status (superseded by
--           idx_orders_status_created composite) and adds missing
--           idx_order_items_product_id.
--
-- Safety:   All CREATE/DROP INDEX use CONCURRENTLY (no table locks).
--           Must run outside a transaction (psql -f auto-commit mode).
--
-- Rollback: See 00013_index_predicate_fix_down.sql
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1: Recreate 5 partial indexes with = true / = false predicates
-- ─────────────────────────────────────────────────────────────────────────────
-- For each: DROP the IS TRUE version, CREATE with = true.
-- PG stores "= true" as bare Var, matching PostgREST's .eq("col", true) output.

-- 1a. Products — storefront listing
DROP INDEX CONCURRENTLY IF EXISTS idx_products_storefront_listing;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_storefront_listing
  ON public.products (is_featured DESC, created_at DESC)
  WHERE is_active = true;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_products_storefront_listing;
--           CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_storefront_listing
--             ON public.products (is_featured DESC, created_at DESC) WHERE is_active IS TRUE;

-- 1b. Product reviews — approved reviews per product
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_approved_by_product;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved_by_product
  ON public.product_reviews (product_id, created_at DESC)
  WHERE is_approved = true;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_approved_by_product;
--           CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved_by_product
--             ON public.product_reviews (product_id, created_at DESC) WHERE is_approved IS TRUE;

-- 1c. Product reviews — pending reviews
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_pending;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pending
  ON public.product_reviews (created_at DESC)
  WHERE is_approved = false;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_pending;
--           CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pending
--             ON public.product_reviews (created_at DESC) WHERE is_approved IS FALSE;

-- 1d. Blog posts — GIN tags for published posts
DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_tags_gin;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_tags_gin
  ON public.blog_posts USING GIN (tags)
  WHERE is_published = true;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_tags_gin;
--           CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_tags_gin
--             ON public.blog_posts USING GIN (tags) WHERE is_published IS TRUE;

-- 1e. Products — low stock count
DROP INDEX CONCURRENTLY IF EXISTS idx_products_low_stock;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
  ON public.products (id)
  WHERE is_active = true AND stock_quantity < 10;
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_products_low_stock;
--           CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
--             ON public.products (id) WHERE is_active IS TRUE AND stock_quantity < 10;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: Drop redundant idx_orders_status
-- ─────────────────────────────────────────────────────────────────────────────
-- idx_orders_status_created(status, created_at DESC) already serves status-only
-- equality queries via its leading column. The standalone idx_orders_status is
-- dead weight that adds write overhead with zero query benefit.

DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status;
-- ROLLBACK: CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
--             ON public.orders (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3: Add missing idx_order_items_product_id
-- ─────────────────────────────────────────────────────────────────────────────
-- Required for has_purchased_product() RPC join performance and FK lookups.
-- Migration 00008 defines this but may not have been applied.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_order_items_product_id
  ON public.order_items (product_id);
-- ROLLBACK: DROP INDEX CONCURRENTLY IF EXISTS idx_order_items_product_id;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 4: Update get_dashboard_stats() RPC
-- ─────────────────────────────────────────────────────────────────────────────
-- Change low_stock subquery from IS TRUE to = true so the planner can match
-- the idx_products_low_stock partial index predicate (stored as bare Var).

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
-- PHASE 5: ANALYZE affected tables
-- ─────────────────────────────────────────────────────────────────────────────

ANALYZE public.products;
ANALYZE public.product_reviews;
ANALYZE public.blog_posts;
ANALYZE public.orders;
ANALYZE public.order_items;
