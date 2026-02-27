---
plan: 03
status: done
commits:
  - 9468933  # All 3 tasks: query files, action updates, cached-queries
requirements_satisfied:
  - CQ-03
---

# Plan 06-03 Summary: Queries Layer Extraction

## What was done

Extracted pure data access functions from server actions into a dedicated `queries/` directory, separating Supabase queries from auth, validation, and ActionResult wrapping.

### Task 1 & 2: Create query files and update actions

Created 6 query files with pure data access functions:

| File | Exports |
|------|---------|
| `queries/products.ts` | queryProducts, queryProductBySlug, queryFeaturedProducts, queryValidateCartPrices, queryAdminProducts, queryAdminProduct |
| `queries/blog.ts` | queryBlogPosts, queryBlogPostBySlug, queryAdminBlogPosts, queryAdminBlogPost |
| `queries/orders.ts` | queryAdminOrders, queryAdminOrder, queryRecentOrders, queryOrderStats, querySalesData |
| `queries/reviews.ts` | queryProductReviews, queryAdminReviews |
| `queries/coupons.ts` | queryAdminCoupons |
| `queries/settings.ts` | queryShopSettings |

Updated all 7 action files to delegate reads to query functions:
- `actions/products.ts` -- imports from queries/products
- `actions/admin-products.ts` -- imports from queries/products
- `actions/blog.ts` -- imports from queries/blog
- `actions/orders.ts` -- imports from queries/orders
- `actions/reviews.ts` -- imports from queries/reviews
- `actions/coupons.ts` -- imports from queries/coupons
- `actions/settings.ts` -- imports from queries/settings

### Task 3: Update cached-queries

Replaced all action imports with query imports in `lib/cached-queries.ts`. Removed the `unwrap()` helper since query functions return raw data directly (no ActionResult to unwrap). Simplified `React.cache()` wrappers to call query functions directly.

## Design decisions

- **Query functions throw on error**: Let the calling layer (actions or error boundaries) handle failures
- **Query functions have no auth**: Auth checks remain in server actions, before calling queries
- **Write operations stay inline**: Only read operations were extracted; writes (insert/update/delete) remain in actions since they involve business logic (Stripe sync, revalidation, rollback)
- **Normalization stays in queries**: `normalizeProduct()`, `normalizeOrder()` etc. are called in query functions since they're data access concerns (converting Postgres numeric strings to JS numbers)
- **Settings always succeeds**: `queryShopSettings` returns safe defaults on error, matching the original contract

## Verification

- TypeScript compilation: zero errors
- No auth checks or ActionResult in queries/ directory
- All action read functions delegate to queries
- Cached queries import exclusively from queries/ (no action imports)
- Write operations correctly remain inline in actions
