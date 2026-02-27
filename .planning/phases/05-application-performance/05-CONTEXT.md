# Phase 5: Application Performance - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Application leverages Next.js 16 caching primitives and eliminates redundant computation. Enable `dynamicIO`, apply `use cache` + `cacheTag`, deduplicate with `React.cache()`, parallelize with `Promise.all()`, add singletons and cleanup patterns. This does NOT change error handling or code structure (Phase 6).

</domain>

<decisions>
## Implementation Decisions

### Next.js 16 Caching (dynamicIO + use cache)
- Enable `dynamicIO: true` in `next.config.ts`
- Apply `"use cache"` directive to read-heavy data functions: shop settings, product listings, blog listings, category listings
- Use `cacheTag()` to tag cached data (e.g., `cacheTag("products")`, `cacheTag("blog")`, `cacheTag("settings")`)
- Mutations call `revalidateTag()` to bust relevant caches (e.g., `createProduct` calls `revalidateTag("products")`)
- Don't cache user-specific data (cart, account, orders) -- only public/shared data

### Request Deduplication
- Wrap data-fetching functions used in both layout and page with `React.cache()` to deduplicate within a single request
- Primary targets: product detail (used in page + metadata), blog post detail (used in page + metadata)
- This prevents the "two DB queries per page load" issue

### Parallelization
- Stripe variant price updates in `updateProduct`: batch with `Promise.all()` instead of sequential loop
- Checkout DB queries: parallelize independent reads (product lookup, coupon validation, settings fetch) with `Promise.all()`
- Any other independent sequential queries identified during implementation

### Singleton Patterns & Cleanup
- Date formatters (`Intl.DateTimeFormat`) as module-level singletons instead of creating per-call
- Admin Supabase client as singleton (if created multiple times in same module)
- `URL.createObjectURL()` calls must have corresponding `URL.revokeObjectURL()` in cleanup/useEffect return
- Cart prices revalidated against server before checkout proceeds (prevent stale price exploitation)
- Auth result cached per request to avoid redundant `getUser()` calls

### Claude's Discretion
- Exact placement of `"use cache"` directives (function level vs file level)
- Which specific functions get `React.cache()` wrapping
- Cache tag naming convention
- Whether to create a shared `cachedAuth()` utility or inline

</decisions>

<specifics>
## Specific Ideas

- `dynamicIO` is the Next.js 16 recommended approach -- replaces manual ISR/revalidation
- Product and blog detail pages currently make 2 DB queries per request (page + generateMetadata)
- Stripe variant updates in admin-products are sequential -- `for` loop with `await` each
- Date formatters are created fresh on every render in multiple components
- Cart stores prices client-side from initial load -- stale if prices change before checkout

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 05-application-performance*
*Context gathered: 2026-02-26*
