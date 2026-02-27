---
phase: 05-application-performance
plan: 02
subsystem: perf
tags: [react-cache, promise-all, deduplication, parallelization]

requires:
  - phase: 05-application-performance
    plan: 01
    provides: caching foundation with use cache + cacheTag
provides:
  - React.cache() wrappers for per-request deduplication on detail pages
  - Promise.all() parallelization for checkout queries and variant updates
affects: [05-application-performance]

tech-stack:
  added: []
  patterns: ["React.cache() for per-request deduplication", "Promise.all() for independent async operations"]

key-files:
  created: []
  modified: [lib/cached-queries.ts, "app/(storefront)/product/[slug]/page.tsx", "app/(storefront)/blog/[slug]/page.tsx", actions/checkout.ts, actions/admin-products.ts]

key-decisions:
  - "React.cache() wraps action functions (not inline queries) — clean separation between caching and data access"
  - "Checkout parallelizes products + variants + settings but keeps coupon sequential (depends on subtotal)"
  - "Variant Promise.all includes both Stripe API calls and DB writes per variant — all are independent"

patterns-established:
  - "Per-request dedup: export const cachedFn = cache(actionFn) in lib/cached-queries.ts"
  - "Parallel queries: Promise.all([query1, query2, ...]) for independent data fetches"

requirements-completed: [PERF-10, PERF-11, PERF-12]

duration: 8min
completed: 2026-02-26
---

# Plan 05-02: React.cache() Deduplication + Promise.all() Parallelization Summary

**Per-request deduplication on detail pages and parallel execution of independent async operations**

## Performance

- **Duration:** 8 min
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Added React.cache() wrappers for getProductBySlug and getBlogPostBySlug — detail pages now make one DB query per request instead of two
- Parallelized checkout DB queries (products + variants + settings) with Promise.all()
- Parallelized variant Stripe updates in updateProduct with Promise.all()

## Task Commits

1. **Task 1: React.cache() deduplication for detail pages** - `c751252` (perf)
2. **Task 2: Promise.all() for checkout + variant updates** - `b1bbf39` (perf)

## Files Created/Modified
- `lib/cached-queries.ts` - Added cachedGetProductBySlug and cachedGetBlogPostBySlug via React.cache()
- `app/(storefront)/product/[slug]/page.tsx` - Uses cachedGetProductBySlug in both generateMetadata and page
- `app/(storefront)/blog/[slug]/page.tsx` - Uses cachedGetBlogPostBySlug in both generateMetadata and page
- `actions/checkout.ts` - Products + variants + settings queries run in parallel via Promise.all()
- `actions/admin-products.ts` - Variant update loop replaced with Promise.all()

## Decisions Made
- React.cache() wraps the action functions directly rather than creating new inline queries — this maintains the clean separation between caching and data access layers
- Coupon query in checkout stays sequential because it depends on subtotal calculated from product prices
- Promise.resolve() used as fallback when no variant IDs exist, maintaining type consistency

## Deviations from Plan
None — implementation matched plan exactly.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Plan 05-03 can proceed with singleton patterns, object URL cleanup, cart price revalidation, and auth caching

---
*Phase: 05-application-performance*
*Completed: 2026-02-26*
