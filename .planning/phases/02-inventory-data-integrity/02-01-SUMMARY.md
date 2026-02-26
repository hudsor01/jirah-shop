---
phase: 02-inventory-data-integrity
plan: 01
subsystem: database, api
tags: [postgres, rpc, stripe, webhook, stock, supabase]

# Dependency graph
requires:
  - phase: 01-critical-security-fixes
    provides: Sanitized error messages in webhook handler
provides:
  - Atomic stock decrement RPC (decrement_stock) in Postgres
  - Webhook handler calls RPC per line item after order creation
  - Critical alerting for insufficient stock via Sentry
affects: [04-database-performance, 07-testing-foundation]

# Tech tracking
tech-stack:
  added: []
  patterns: [atomic-rpc-with-row-count, sequential-rpc-per-line-item]

key-files:
  created:
    - supabase/migrations/00009_decrement_stock_rpc.sql
  modified:
    - app/api/webhooks/stripe/route.ts

key-decisions:
  - "SECURITY DEFINER on RPC matches existing increment_coupon_uses convention"
  - "Sequential for...of loop (not Promise.all) for ordered Sentry logs"
  - "Failed stock decrement logs error but does not block remaining items"

patterns-established:
  - "Atomic RPC with row count return: zero rows = precondition failed, logged as critical"
  - "Non-fatal webhook errors: log via logger.error() but continue processing"

requirements-completed: [INV-01, INV-02, INV-03]

# Metrics
duration: 8min
completed: 2026-02-26
---

# Phase 2 Plan 01: Atomic Stock Decrement RPC and Webhook Integration Summary

**Postgres RPC `decrement_stock` with atomic WHERE clause eliminates TOCTOU race condition; webhook decrements stock per line item with Sentry alerting on insufficient stock**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-26
- **Completed:** 2026-02-26
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Created atomic `decrement_stock` Postgres RPC that prevents negative stock via `WHERE stock_quantity >= p_quantity`
- Integrated RPC into Stripe webhook handler with per-line-item sequential processing
- Zero-row returns trigger `logger.error()` with orderId, productId, variantId, requestedQuantity for Sentry alerting

## Task Commits

Each task was committed atomically:

1. **Task 1: Create atomic stock decrement RPC migration** - `b7a9d68` (feat)
2. **Task 2: Integrate stock decrement into webhook handler** - `2d4c828` (feat)

## Files Created/Modified
- `supabase/migrations/00009_decrement_stock_rpc.sql` - Atomic stock decrement RPC with variant/product branching
- `app/api/webhooks/stripe/route.ts` - Added stock decrement loop after order items insert

## Decisions Made
- Used `SECURITY DEFINER` (matches existing `increment_coupon_uses` convention in migration 00004)
- Sequential `for...of` loop instead of `Promise.all` for ordered log output
- Failed stock decrement does not throw or break -- continues processing remaining items (partial fulfillment logging)

## Deviations from Plan

None - plan executed exactly as written

## Issues Encountered

None

## User Setup Required

**The `decrement_stock` RPC must be applied to the production Supabase database.** Run the migration:
```sql
-- Apply supabase/migrations/00009_decrement_stock_rpc.sql to your Supabase database
```

## Next Phase Readiness
- Stock decrement is atomic and race-condition-free
- RPC pattern established for Phase 4 (Database Performance) which creates additional RPCs
- Webhook handler structure ready for testing in Phase 7

---
*Phase: 02-inventory-data-integrity*
*Completed: 2026-02-26*
