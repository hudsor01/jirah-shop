# Phase 4: Database Performance - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

All database queries that degrade at scale are replaced with efficient server-side operations. Postgres RPCs for aggregations, N+1 elimination, and server-side pagination on all listing endpoints. This does NOT add application-level caching (Phase 5) or change error handling patterns (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Admin Dashboard Stats RPC
- Create Postgres RPC `get_dashboard_stats()` returning: total orders, pending orders, completed orders, total revenue
- Single query with conditional aggregation (`COUNT(*) FILTER (WHERE ...)`) instead of 4 separate JS queries
- Replace current JS-side aggregation in the admin dashboard page

### Sales Analytics RPC
- Create Postgres RPC `get_sales_analytics(p_days INT)` that does `GROUP BY date_trunc('day', created_at)`
- Returns daily sales data (date, order_count, revenue) for the last N days
- Replace current pattern of downloading full orders table and aggregating in JavaScript

### N+1 Customer Orders Fix
- Replace per-customer `COUNT(*)` queries with a single grouped query: `SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id`
- Join or map results in a single query to the customers listing

### Pagination Strategy
- All listing endpoints get cursor-based or offset-based pagination (offset is fine for admin, cursor for storefront if needed)
- Page size: 20 items for storefront (products, blog), 25 for admin tables (orders, customers, reviews)
- Endpoints to paginate: storefront products, blog listing, product reviews, account order history, admin orders, admin customers
- Blog listing query should exclude the `content` column (only fetch title, slug, excerpt, date, image)
- Return `{ data, total, page, pageSize }` shape from paginated queries

### Claude's Discretion
- Exact RPC SQL implementation details
- Whether to use `OFFSET/LIMIT` or keyset pagination
- Migration file numbering
- Whether pagination params come from searchParams or action arguments

</decisions>

<specifics>
## Specific Ideas

- Admin dashboard currently makes 4+ separate queries and aggregates in JS (PERF-01)
- Sales chart downloads all orders to JS for date grouping (PERF-02)
- Admin customers page does N+1: one COUNT query per customer row (PERF-03)
- Blog listing fetches full `content` column even though only title/excerpt shown (PERF-07)
- Storefront products page loads ALL products with no pagination (PERF-04)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 04-database-performance*
*Context gathered: 2026-02-26*
