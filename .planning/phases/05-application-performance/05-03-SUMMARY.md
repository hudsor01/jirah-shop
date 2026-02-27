---
phase: 05-application-performance
plan: 03
subsystem: perf
tags: [singleton, memory-leak, cart-validation, auth-caching]

requires:
  - phase: 05-application-performance
    plan: 01
    provides: caching foundation with use cache + cacheTag
provides:
  - Module-level singleton date formatters and admin Supabase client
  - Object URL memory leak prevention via useEffect cleanup
  - Cart price revalidation before checkout
  - Per-request auth caching via React.cache()
affects: [05-application-performance]

tech-stack:
  added: []
  patterns: ["Module-level singleton for stateless instances", "React.cache() for per-request auth dedup", "Server-side price validation before checkout"]

key-files:
  created: []
  modified: [lib/format.ts, lib/supabase/admin.ts, lib/auth.ts, hooks/use-supabase-upload.ts, actions/products.ts, providers/cart-provider.tsx, components/storefront/cart-drawer.tsx, "app/(storefront)/cart/page.tsx"]

key-decisions:
  - "Date formatters follow existing priceFormatter singleton pattern — module-level Intl.DateTimeFormat instances"
  - "Admin client uses lazy singleton (created on first call) since it's stateless — no session or cookies"
  - "Auth caching wraps requireAdmin directly rather than creating private _requireAdmin — keeps export name identical"
  - "Object URL cleanup runs on unmount only (empty deps) — revoking during state changes would break previews"
  - "Cart price validation creates dedicated updateItemPrices function rather than repurposing updateQuantity"

patterns-established:
  - "Singleton: module-level const for Intl formatters; lazy let for heavier clients"
  - "Price revalidation: validate server prices -> update cart if stale -> show toast -> block checkout until reviewed"

requirements-completed: [PERF-13, PERF-14, PERF-15, PERF-16, PERF-17]

duration: 10min
completed: 2026-02-26
---

# Plan 05-03: Singletons, Cleanup, Cart Revalidation & Auth Caching Summary

**Singleton patterns for formatters and admin client, object URL memory leak fix, cart price revalidation before checkout, and per-request auth caching**

## Performance

- **Duration:** 10 min
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Date formatters in lib/format.ts now use module-level Intl.DateTimeFormat singletons (matching existing priceFormatter pattern)
- Admin Supabase client converted to lazy singleton — created once on first call, reused thereafter
- requireAdmin wrapped with React.cache() so multiple calls within a single request share one getUser() call
- Object URLs from useSupabaseUpload are revoked on component unmount via useEffect cleanup
- Cart checkout flow validates prices against server before proceeding — stale prices get updated with a toast instead of silently proceeding

## Task Commits

1. **Task 1: Singleton patterns for formatters, admin client, and auth** - `7bd2f6e` (perf)
2. **Task 2: Object URL cleanup and cart price revalidation** - `907db9e` (perf)

## Files Created/Modified
- `lib/format.ts` - Module-level dateFormatter and dateLongFormatter singletons
- `lib/supabase/admin.ts` - Lazy singleton pattern for admin Supabase client
- `lib/auth.ts` - requireAdmin wrapped with React.cache() for per-request dedup
- `hooks/use-supabase-upload.ts` - useEffect cleanup that revokes object URLs on unmount
- `actions/products.ts` - New validateCartPrices server action with Zod validation and parallel DB queries
- `providers/cart-provider.tsx` - New updateItemPrices function in cart context
- `components/storefront/cart-drawer.tsx` - Calls validateCartPrices before createCheckoutSession
- `app/(storefront)/cart/page.tsx` - Calls validateCartPrices before createCheckoutSession

## Decisions Made
- Lazy singleton for admin client (let + null check) rather than eager module-level creation — avoids errors if env vars are missing at import time
- useEffect cleanup uses empty deps array — revoking URLs during files state changes would break preview display for files still in the list
- Created dedicated updateItemPrices in cart provider rather than overloading updateQuantity — cleaner separation of concerns
- validateCartPrices uses parallel Promise.all for products and variants queries, matching the checkout parallelization pattern from Plan 05-02

## Deviations from Plan
None — implementation matched plan exactly.

## Issues Encountered
None.

## User Setup Required
None.

## Next Phase Readiness
- Phase 5 is now complete — all 10 PERF requirements addressed
- Phase 6 (Error Handling & Data Access) can proceed

---
*Phase: 05-application-performance*
*Completed: 2026-02-26*
