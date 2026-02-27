-- Sales analytics aggregation RPC
--
-- Signature: get_sales_analytics(p_days integer default 30)
-- Returns:  TABLE(date date, order_count bigint, revenue numeric)
--
-- Purpose:  Replaces full-table download + JS grouping with a single
--           Postgres GROUP BY date_trunc('day') query. Only returns dates
--           that have data; JS caller fills date gaps for chart display.
--
-- Usage:    Called from getSalesData() behind requireAdmin() guard.

create or replace function public.get_sales_analytics(p_days integer default 30)
returns table(date date, order_count bigint, revenue numeric)
language plpgsql
security definer
as $$
begin
  return query
    select
      date_trunc('day', o.created_at)::date as date,
      count(*) as order_count,
      coalesce(sum(o.total), 0) as revenue
    from public.orders o
    where o.status in ('paid', 'shipped', 'delivered')
      and o.created_at >= (current_date - p_days)
    group by date_trunc('day', o.created_at)::date
    order by date asc;
end;
$$;
