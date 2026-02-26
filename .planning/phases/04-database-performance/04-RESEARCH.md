# Phase 4: Database Performance - Research

**Researched:** 2026-02-26
**Domain:** Postgres RPCs, N+1 elimination, server-side pagination (Supabase)
**Confidence:** HIGH

## Summary

Phase 4 replaces every database query that degrades at scale with efficient server-side operations. Three distinct problem areas exist in the current codebase:

1. **Admin dashboard stats and sales analytics** -- `getOrderStats()` makes 4 separate Supabase queries and reduces revenue in JS; `getSalesData()` downloads all qualifying orders and groups by date in JS. Both should be single Postgres RPCs with `COUNT(*) FILTER` and `GROUP BY date_trunc('day')`.

2. **N+1 on customers page** -- The admin customers page fetches all orders for the page's customer IDs, then reduces counts in JS. Should be a single grouped query.

3. **Missing pagination** -- Storefront products, blog listing, product reviews, and account order history load all rows. Blog listing also fetches the `content` column unnecessarily.

**Primary recommendation:** Create two SQL migration files (RPCs for stats/analytics, and indexes to support pagination), then update the TypeScript action files and page components to use them.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Create Postgres RPC `get_dashboard_stats()` returning: total orders, pending orders, completed orders, total revenue
- Single query with conditional aggregation (`COUNT(*) FILTER (WHERE ...)`) instead of 4 separate JS queries
- Replace current JS-side aggregation in the admin dashboard page
- Create Postgres RPC `get_sales_analytics(p_days INT)` that does `GROUP BY date_trunc('day', created_at)`
- Returns daily sales data (date, order_count, revenue) for the last N days
- Replace current pattern of downloading full orders table and aggregating in JavaScript
- Replace per-customer `COUNT(*)` queries with a single grouped query: `SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id`
- Join or map results in a single query to the customers listing
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

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERF-01 | `getOrderStats` uses single Postgres RPC with `COUNT(*) FILTER` instead of 4 sequential queries + JS reduce | RPC `get_dashboard_stats()` with conditional aggregation; existing RPC pattern from decrement_stock |
| PERF-02 | `getSalesData` uses Postgres RPC with `GROUP BY date_trunc('day')` instead of downloading all rows | RPC `get_sales_analytics(p_days)` returning daily aggregates |
| PERF-03 | Admin customers page uses grouped `COUNT(*)` query instead of N+1 per-customer order counts | Single Supabase query with grouped count, or RPC approach |
| PERF-04 | Storefront products listing has server-side pagination with `range()` | Supabase `.range()` + `{ count: 'exact' }` already used in admin; apply to storefront `getProducts()` |
| PERF-05 | Product reviews have cursor-based pagination | Offset pagination via `.range()` on `getProductReviews()` (cursor not needed for review lists) |
| PERF-06 | Blog listing excludes `content` column and has pagination | `.select('id, title, slug, excerpt, ...')` explicit column list + `.range()` |
| PERF-07 | Account order history has pagination | `.range()` on account page orders query with searchParams for page |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase JS | @supabase/supabase-js (already installed) | Database client | Project's existing DB client via `@supabase/ssr` |
| Postgres (Supabase) | PL/pgSQL | RPCs for aggregation | Supabase standard for server-side computation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lib/pagination.ts | (existing) | `parsePagination()` helper | Already used by admin actions -- extend to storefront |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Offset pagination | Keyset/cursor pagination | Keyset is better for large datasets but offset is simpler and sufficient for this store's scale; admin already uses offset |
| Supabase RPC | Supabase views | RPCs allow parameterized queries (e.g., `p_days`); views are static |
| Database-level counting | JS counting | JS counting downloads all rows -- defeats the purpose |

**Installation:** No new packages needed. All changes are SQL migrations + TypeScript refactors.

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
├── 00010_dashboard_stats_rpc.sql      # get_dashboard_stats()
├── 00011_sales_analytics_rpc.sql      # get_sales_analytics(p_days)
actions/
├── orders.ts                          # Updated getOrderStats, getSalesData
├── products.ts                        # Updated getProducts with pagination
├── blog.ts                            # Updated getBlogPosts with pagination, column exclusion
├── reviews.ts                         # Updated getProductReviews with pagination
app/(storefront)/
├── shop/page.tsx                      # Reads page from searchParams
├── blog/page.tsx                      # Reads page from searchParams
├── account/page.tsx                   # Reads page from searchParams
├── product/[slug]/page.tsx            # Reviews section with pagination
app/admin/
├── customers/page.tsx                 # Fix N+1 with grouped query
├── page.tsx                           # Uses RPC for stats
├── analytics/page.tsx                 # Uses RPC for sales data
```

### Pattern 1: Postgres RPC with Conditional Aggregation
**What:** Single RPC returning multiple metrics via `COUNT(*) FILTER (WHERE ...)`
**When to use:** Dashboard stats that need multiple counts from the same table
**Example:**
```sql
-- Follows existing pattern from decrement_stock and increment_coupon_uses
create or replace function public.get_dashboard_stats()
returns json
language plpgsql
security definer
as $$
declare
  result json;
begin
  select json_build_object(
    'total_orders', count(*),
    'pending_orders', count(*) filter (where status = 'pending'),
    'completed_orders', count(*) filter (where status in ('delivered')),
    'total_revenue', coalesce(sum(total) filter (where status in ('paid', 'shipped', 'delivered')), 0),
    'orders_today', count(*) filter (where created_at >= current_date),
    'total_customers', (select count(*) from public.customer_profiles),
    'low_stock_products', (select count(*) from public.products where is_active = true and stock_quantity < 10)
  ) into result
  from public.orders;

  return result;
end;
$$;
```

### Pattern 2: Parameterized Date Aggregation RPC
**What:** RPC that accepts a time window and returns grouped daily data
**When to use:** Sales analytics charts
**Example:**
```sql
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
  order by date;
end;
$$;
```

### Pattern 3: Supabase Offset Pagination
**What:** Using `.select('*', { count: 'exact' }).range(from, to)` pattern
**When to use:** All listing endpoints
**Example:**
```typescript
// Already used in getAdminOrders -- apply to storefront
export async function getProducts(options?: {
  page?: number;
  limit?: number;
  // ... existing params
}): Promise<{ data: Product[]; total: number; page: number; pageSize: number }> {
  const { page, pageSize, from, to } = parsePagination(options);

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .range(from, to);

  // ... filters, sorting ...

  const { data, count } = await query;
  return { data: data ?? [], total: count ?? 0, page, pageSize };
}
```

### Pattern 4: Column Exclusion for Blog Listing
**What:** Explicitly select only needed columns to avoid fetching large `content` blobs
**When to use:** Blog listing where only title/excerpt/metadata shown
**Example:**
```typescript
const { data, count } = await supabase
  .from("blog_posts")
  .select("id, title, slug, excerpt, cover_image, tags, is_published, published_at, created_at", { count: "exact" })
  .eq("is_published", true)
  .range(from, to);
```

### Anti-Patterns to Avoid
- **Downloading all rows to JS for aggregation:** The current `getSalesData` and `getOrderStats` do this -- defeats the purpose of a database
- **N+1 queries:** The current customers page fetches orders for each customer separately
- **Selecting `*` when only a subset is needed:** Blog listing fetches `content` (potentially large HTML) when only title/excerpt are displayed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date grouping | JS date reduction | Postgres `date_trunc` + `GROUP BY` | Postgres handles timezone, grouping, and aggregation natively |
| Conditional counts | Multiple JS `.filter()` calls | Postgres `COUNT(*) FILTER (WHERE ...)` | Single table scan instead of N |
| Pagination offset calc | Custom math | Existing `parsePagination()` | Already tested and used by admin pages |

## Common Pitfalls

### Pitfall 1: RLS Bypassing with SECURITY DEFINER
**What goes wrong:** RPCs with `SECURITY DEFINER` run as the function owner, bypassing RLS
**Why it happens:** RPCs need to read across all rows (e.g., all orders for stats)
**How to avoid:** Use `SECURITY DEFINER` intentionally for admin-only RPCs; ensure the calling code has `requireAdmin()` guard
**Warning signs:** An unauthenticated user calling the RPC directly via PostgREST

### Pitfall 2: Supabase `.rpc()` Return Types
**What goes wrong:** Supabase JS client returns `{ data, error }` from `.rpc()` but the shape of `data` depends on the function's return type
**Why it happens:** `RETURNS json` gives a single JSON object; `RETURNS TABLE` gives an array of rows
**How to avoid:** For `get_dashboard_stats` (returns json): access `data` directly. For `get_sales_analytics` (returns table): `data` is an array of `{ date, order_count, revenue }`
**Warning signs:** Trying to `.map()` over a JSON object, or treating an array as a single object

### Pitfall 3: Pagination Returning Wrong Count on Filtered Queries
**What goes wrong:** Using `{ count: 'exact' }` with `.range()` returns total matching rows (correct), but forgetting to include it returns `null`
**Why it happens:** Supabase requires explicit opt-in for count
**How to avoid:** Always pass `{ count: 'exact' }` in the `.select()` call when pagination is needed

### Pitfall 4: Blog Content Column Still Fetched
**What goes wrong:** Using `.select('*')` on blog_posts still fetches the (potentially large) content column
**Why it happens:** Habit of using `*` instead of explicit column lists
**How to avoid:** Explicit column list in `.select()` for listing queries

### Pitfall 5: Empty Date Gaps in Sales Chart
**What goes wrong:** Postgres `GROUP BY date_trunc` only returns dates with data -- gaps show as missing bars in chart
**Why it happens:** The RPC only returns rows that have orders
**How to avoid:** Either use `generate_series` in the RPC to fill gaps, OR fill gaps in the JS consumer (simpler). Current JS code already fills gaps with zeros.

## Code Examples

### Current Problematic Patterns (to be replaced)

**getOrderStats -- 4 separate queries + JS reduce:**
```typescript
// actions/orders.ts:141-185 -- CURRENT (BAD)
const { data: revenueData } = await supabase.from("orders").select("total").in("status", [...]);
const totalRevenue = revenueData?.reduce((sum, o) => sum + toNum(o.total), 0) ?? 0;
const { count: ordersToday } = await supabase.from("orders").select("*", { count: "exact", head: true }).gte(...);
const { count: totalCustomers } = await supabase.from("customer_profiles").select("*", { count: "exact", head: true });
const { count: lowStockProducts } = await supabase.from("products").select("*", { count: "exact", head: true }).lt(...);
```

**getSalesData -- downloads all rows, groups in JS:**
```typescript
// actions/orders.ts:205-249 -- CURRENT (BAD)
const { data } = await supabase.from("orders").select("total, created_at").in("status", [...]).gte(...);
// Then groups by date in JS with reduce
```

**Customers N+1:**
```typescript
// app/admin/customers/page.tsx:47-67 -- CURRENT (BAD)
const { data: orderData } = await supabase.from("orders").select("user_id").in("user_id", customerIds);
// Then reduces to counts in JS
```

**Products -- no pagination:**
```typescript
// actions/products.ts:22-79 -- CURRENT (BAD)
// No .range(), no { count: 'exact' }, returns all matching products
```

### Existing Good Patterns (to replicate)

**Admin orders -- already paginated:**
```typescript
// actions/orders.ts:32-73 -- GOOD pattern to follow
let query = supabase.from("orders").select("*", { count: "exact" });
query = query.order("created_at", { ascending: false }).range(from, to);
return { orders: data, count: count ?? 0 };
```

**Existing RPC convention:**
```sql
-- supabase/migrations/00009_decrement_stock_rpc.sql
-- SECURITY DEFINER, PL/pgSQL, clear parameter naming
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| JS-side aggregation | Postgres RPC with `COUNT(*) FILTER` | Always been best practice | Single query vs 4+, no data transfer |
| `SELECT *` on listings | Explicit column selection | Always been best practice | Smaller payloads, especially with text/jsonb |
| Load-all-then-paginate | `range()` with `count: 'exact'` | Supabase JS v2+ | Constant query time regardless of total rows |

## Open Questions

1. **Date gap filling in sales analytics RPC**
   - What we know: Current JS fills gaps with zeros; Postgres `generate_series` could do it in SQL
   - What's unclear: Whether to add complexity to the RPC or keep gap-filling in JS
   - Recommendation: Keep gap-filling in JS (simpler, current code already does it). RPC returns only dates with data.

2. **Whether storefront needs cursor pagination or offset is sufficient**
   - What we know: Products, blog, reviews are all small-to-medium tables (hundreds, not millions)
   - What's unclear: Whether future scale would warrant cursor pagination
   - Recommendation: Use offset pagination (consistent with existing admin patterns, simpler). Can migrate to cursor later if needed.

3. **Reviews on product detail page**
   - What we know: `getProductReviews()` exists in `actions/reviews.ts` but is not called from the product detail page yet
   - What's unclear: Whether to add review display as part of this phase or defer
   - Recommendation: Add pagination to `getProductReviews()` per PERF-05, but only wire it to product page if reviews are already displayed there. Currently they aren't shown.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `actions/orders.ts`, `actions/products.ts`, `actions/blog.ts`, `actions/reviews.ts`
- Codebase analysis: `app/admin/page.tsx`, `app/admin/analytics/page.tsx`, `app/admin/customers/page.tsx`
- Codebase analysis: `app/(storefront)/shop/page.tsx`, `app/(storefront)/blog/page.tsx`, `app/(storefront)/account/page.tsx`
- Existing migration patterns: `supabase/migrations/00009_decrement_stock_rpc.sql`
- Existing pagination utility: `lib/pagination.ts`

### Secondary (MEDIUM confidence)
- Supabase JS client `.rpc()` documentation (standard pattern, well-established)
- Postgres `COUNT(*) FILTER (WHERE ...)` syntax (SQL standard since Postgres 9.4)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using only existing libraries and Postgres features
- Architecture: HIGH - patterns already exist in codebase (admin pagination, RPC conventions)
- Pitfalls: HIGH - documented from direct codebase analysis

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (stable -- no external library dependencies)
