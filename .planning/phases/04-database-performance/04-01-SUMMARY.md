## Plan 04-01 Summary: Postgres RPCs for Dashboard Stats and Sales Analytics

**Status**: COMPLETE
**Commit**: 3a79a43

### What was done
1. Created `supabase/migrations/00010_dashboard_stats_rpc.sql` — `get_dashboard_stats()` RPC
   - Returns JSON with total_orders, pending_orders, completed_orders, total_revenue, orders_today, total_customers, low_stock_products
   - Uses subqueries for each metric in a single DB round trip
   - SECURITY DEFINER, PL/pgSQL

2. Created `supabase/migrations/00011_sales_analytics_rpc.sql` — `get_sales_analytics(p_days)` RPC
   - Returns TABLE(date, order_count, revenue) grouped by day
   - Filters by paid/shipped/delivered status
   - SECURITY DEFINER, PL/pgSQL

3. Updated `actions/orders.ts`:
   - `getOrderStats()` — replaced 4 separate Supabase queries + JS reduce with single `supabase.rpc('get_dashboard_stats')`
   - `getSalesData()` — replaced full-table download + JS grouping with `supabase.rpc('get_sales_analytics', { p_days })`
   - Date gap filling preserved for chart display
   - Removed unused `LOW_STOCK_THRESHOLD` and `toNum` imports

### Verification
- [x] `getOrderStats()` calls `supabase.rpc('get_dashboard_stats')`
- [x] `getSalesData()` calls `supabase.rpc('get_sales_analytics')`
- [x] No JS-side aggregation remains
- [x] Return types unchanged (no breaking changes for consumers)
- [x] TypeScript compiles without errors
