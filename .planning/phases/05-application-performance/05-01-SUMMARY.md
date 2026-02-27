---
phase: 05-application-performance
plan: 01
subsystem: infra
tags: [next.js, caching, use-cache, cacheTag, updateTag]

requires:
  - phase: 04-code-quality
    provides: clean codebase ready for performance optimization
provides:
  - Next.js 16 useCache experimental flag enabled
  - Cached query wrappers for shop settings, products, blog posts
  - Tag-based cache invalidation on mutations via updateTag()
  - Storefront pages using cached queries
affects: [05-application-performance]

tech-stack:
  added: []
  patterns: ["use cache directive for cross-request caching", "cacheTag() for tagged cache entries", "updateTag() for server action cache invalidation"]

key-files:
  created: [lib/cached-queries.ts]
  modified: [next.config.ts, actions/settings.ts, actions/admin-products.ts, actions/blog.ts, app/layout.tsx, "app/(storefront)/page.tsx", "app/(storefront)/shop/page.tsx", "app/(storefront)/shop/[category]/page.tsx", "app/(storefront)/blog/page.tsx"]

key-decisions:
  - "Used experimental.useCache instead of dynamicIO — Next.js 16.1.6 renamed the config key"
  - "Used updateTag() instead of revalidateTag() — in Next.js 16 revalidateTag requires a profile parameter, updateTag is the single-argument server action API"
  - "Created lib/cached-queries.ts as separate module since 'use cache' cannot coexist with 'use server' in the same file"

patterns-established:
  - "Cached query pattern: wrap data functions in lib/cached-queries.ts with 'use cache' + cacheTag()"
  - "Mutation invalidation: add updateTag() alongside existing revalidatePath() in server actions"
  - "Storefront pages import from @/lib/cached-queries, not directly from action files"

requirements-completed: [PERF-08, PERF-09]

duration: 12min
completed: 2026-02-26
---

# Plan 05-01: Caching Foundation Summary

**Next.js 16 useCache enabled with cached query wrappers for storefront data and updateTag() invalidation on all mutations**

## Performance

- **Duration:** 12 min
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments
- Enabled Next.js 16 experimental useCache flag in next.config.ts
- Created lib/cached-queries.ts with "use cache" + cacheTag() wrappers for getShopSettings, getProducts, getFeaturedProducts, getBlogPosts
- Added updateTag() calls to all mutation actions (settings, products, blog) for cache invalidation
- Updated all storefront pages to use cached query imports

## Task Commits

1. **Task 1: Enable useCache + create cached query functions** - `6ff6216` (perf)
2. **Task 2: Add updateTag to mutations + update storefront consumers** - `d992738` (perf)

## Files Created/Modified
- `lib/cached-queries.ts` - Cached wrapper functions with "use cache" + cacheTag()
- `next.config.ts` - Added experimental.useCache: true
- `actions/settings.ts` - Added updateTag("shop-settings") to updateShopSettings
- `actions/admin-products.ts` - Added updateTag("products") to create/update/delete product
- `actions/blog.ts` - Added updateTag("blog") to create/update/delete blog post
- `app/layout.tsx` - Uses cachedGetShopSettings()
- `app/(storefront)/page.tsx` - Uses cachedGetFeaturedProducts()
- `app/(storefront)/shop/page.tsx` - Uses cachedGetProducts()
- `app/(storefront)/shop/[category]/page.tsx` - Uses cachedGetProducts()
- `app/(storefront)/blog/page.tsx` - Uses cachedGetBlogPosts()

## Decisions Made
- Used `experimental.useCache` instead of `dynamicIO` -- Next.js 16.1.6 renamed the config key from the canary/15.x name
- Used `updateTag()` instead of `revalidateTag()` -- in Next.js 16 revalidateTag requires a second `profile` parameter, while updateTag is the simple single-argument API for server action cache invalidation
- Also updated `app/(storefront)/shop/page.tsx` which was not in the original plan but also calls getProducts directly

## Deviations from Plan

### Auto-fixed Issues

**1. [Config Key] useCache instead of dynamicIO**
- **Found during:** Task 1 (Enable dynamicIO)
- **Issue:** `dynamicIO` is not a valid experimental config key in Next.js 16.1.6; it was renamed to `useCache`
- **Fix:** Used `experimental: { useCache: true }` instead
- **Files modified:** next.config.ts
- **Verification:** TypeScript compiles, no errors
- **Committed in:** 6ff6216

**2. [API Change] updateTag instead of revalidateTag**
- **Found during:** Task 2 (Add revalidateTag to mutations)
- **Issue:** `revalidateTag` in Next.js 16 requires 2 arguments (tag + profile), not 1
- **Fix:** Used `updateTag()` which takes a single tag argument and is designed for server action usage
- **Files modified:** actions/settings.ts, actions/admin-products.ts, actions/blog.ts
- **Verification:** TypeScript compiles, no errors
- **Committed in:** d992738

---

**Total deviations:** 2 auto-fixed (2 API changes for Next.js 16 compatibility)
**Impact on plan:** Both fixes necessary for TypeScript compilation. Same functionality achieved with correct API.

## Issues Encountered
None beyond the API changes noted above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Caching foundation is in place for Plans 05-02 and 05-03
- React.cache() deduplication and Promise.all() parallelization can proceed

---
*Phase: 05-application-performance*
*Completed: 2026-02-26*
