-- ═══════════════════════════════════════════════════════════════════════════════
-- Rollback: 00013_index_predicate_fix
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Reverses all changes from 00013_index_predicate_fix.sql.
-- Restores IS TRUE / IS FALSE partial index predicates and reinstates
-- idx_orders_status.
--
-- IMPORTANT: Run outside a transaction (CONCURRENTLY requires auto-commit).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1: Restore IS TRUE / IS FALSE partial indexes
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX CONCURRENTLY IF EXISTS idx_products_storefront_listing;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_storefront_listing
  ON public.products (is_featured DESC, created_at DESC)
  WHERE is_active IS TRUE;

DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_approved_by_product;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_approved_by_product
  ON public.product_reviews (product_id, created_at DESC)
  WHERE is_approved IS TRUE;

DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_pending;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_pending
  ON public.product_reviews (created_at DESC)
  WHERE is_approved IS FALSE;

DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_tags_gin;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_tags_gin
  ON public.blog_posts USING GIN (tags)
  WHERE is_published IS TRUE;

DROP INDEX CONCURRENTLY IF EXISTS idx_products_low_stock;
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock
  ON public.products (id)
  WHERE is_active IS TRUE AND stock_quantity < 10;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: Restore idx_orders_status
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status
  ON public.orders (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3: Drop idx_order_items_product_id
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX CONCURRENTLY IF EXISTS idx_order_items_product_id;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 4: Restore get_dashboard_stats() with IS TRUE
-- ─────────────────────────────────────────────────────────────────────────────

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
      WHERE is_active IS TRUE
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


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 5: ANALYZE affected tables
-- ─────────────────────────────────────────────────────────────────────────────

ANALYZE public.products;
ANALYZE public.product_reviews;
ANALYZE public.blog_posts;
ANALYZE public.orders;
ANALYZE public.order_items;
