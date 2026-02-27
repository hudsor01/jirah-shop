-- ═══════════════════════════════════════════════════════════════════════════════
-- Rollback: 00012_index_optimization
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Reverses all changes from 00012_index_optimization.sql.
-- Run this if the migration causes issues.
--
-- IMPORTANT: Run outside a transaction (CONCURRENTLY requires auto-commit).
-- ═══════════════════════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 1: Restore original get_dashboard_stats() RPC
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_orders', (SELECT count(*) FROM public.orders),
    'pending_orders', (SELECT count(*) FROM public.orders WHERE status = 'pending'),
    'completed_orders', (SELECT count(*) FROM public.orders WHERE status = 'delivered'),
    'total_revenue', (
      SELECT coalesce(sum(total), 0)
      FROM public.orders
      WHERE status IN ('paid', 'shipped', 'delivered')
    ),
    'orders_today', (
      SELECT count(*)
      FROM public.orders
      WHERE created_at >= current_date
    ),
    'total_customers', (SELECT count(*) FROM public.customer_profiles),
    'low_stock_products', (
      SELECT count(*)
      FROM public.products
      WHERE is_active = true
        AND stock_quantity < 10
    )
  ) INTO result;

  RETURN result;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 2: Restore dropped indexes
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_slug
  ON public.products (slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_slug
  ON public.blog_posts (slug);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_coupons_code
  ON public.coupons (code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_active
  ON public.products (is_active);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_is_featured
  ON public.products (is_featured);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_blog_posts_is_published
  ON public.blog_posts (is_published);


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 3: Drop new indexes
-- ─────────────────────────────────────────────────────────────────────────────

DROP INDEX CONCURRENTLY IF EXISTS idx_products_storefront_listing;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_approved_by_product;
DROP INDEX CONCURRENTLY IF EXISTS idx_reviews_pending;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_status_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_revenue_by_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_orders_user_purchases;
DROP INDEX CONCURRENTLY IF EXISTS idx_blog_posts_tags_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_products_low_stock;
DROP INDEX CONCURRENTLY IF EXISTS idx_coupons_created;


-- ─────────────────────────────────────────────────────────────────────────────
-- PHASE 4: Re-analyze tables
-- ─────────────────────────────────────────────────────────────────────────────

ANALYZE public.products;
ANALYZE public.product_reviews;
ANALYZE public.orders;
ANALYZE public.order_items;
ANALYZE public.blog_posts;
ANALYZE public.coupons;
