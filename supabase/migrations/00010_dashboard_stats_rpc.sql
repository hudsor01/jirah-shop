-- Dashboard stats aggregation RPC
--
-- Signature: get_dashboard_stats()
-- Returns:  json with keys:
--           total_orders, pending_orders, completed_orders, total_revenue,
--           orders_today, total_customers, low_stock_products
--
-- Purpose:  Replaces 4 separate JS queries with a single Postgres call.
--           Uses COUNT(*) FILTER for conditional counts on the orders table,
--           plus subqueries for customer_profiles and products counts.
--
-- Usage:    Called from getOrderStats() behind requireAdmin() guard.

create or replace function public.get_dashboard_stats()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'total_orders', (select count(*) from public.orders),
    'pending_orders', (select count(*) from public.orders where status = 'pending'),
    'completed_orders', (select count(*) from public.orders where status = 'delivered'),
    'total_revenue', (
      select coalesce(sum(total), 0)
      from public.orders
      where status in ('paid', 'shipped', 'delivered')
    ),
    'orders_today', (
      select count(*)
      from public.orders
      where created_at >= current_date
    ),
    'total_customers', (select count(*) from public.customer_profiles),
    'low_stock_products', (
      select count(*)
      from public.products
      where is_active = true
        and stock_quantity < 10
    )
  ) into result;

  return result;
end;
$$;
