---
phase: 07-testing-foundation
plan: 02
subsystem: testing
tags: [vitest, checkout, webhook, stripe, supabase, integration-test]

requires:
  - phase: 07-testing-foundation
    plan: 01
    provides: Mock factories for Supabase and Stripe, test fixtures
provides:
  - 24-test checkout action test suite covering all validation and session creation paths
  - 17-test webhook handler integration test covering order creation, stock, coupons, refunds
affects: [07-07]

tech-stack:
  added: []
  patterns: ["vi.hoisted() for mock variables in vi.mock factories", "setupProductLookup/setupCouponLookup helpers for multi-table mocks"]

key-files:
  created:
    - tests/unit/actions/checkout.test.ts
    - tests/integration/webhook.test.ts
  modified: []

key-decisions:
  - "Used vi.hoisted() instead of plain const for mock variables referenced inside vi.mock() factories to avoid ReferenceError"
  - "Webhook tests classified as integration tests (tests/integration/) since they exercise full HTTP request handling"
  - "Helper functions (setupProductLookup, setupCouponLookup, setupCheckoutMocks) encapsulate complex multi-table Supabase mock chains"

patterns-established:
  - "vi.hoisted() pattern: const { mockX, mockY } = vi.hoisted(() => ({...})) for all mock variables used in vi.mock factories"
  - "Test helper functions encapsulate table-specific mock routing for Supabase from().select().eq() chains"
  - "Webhook tests use makeRequest/makeCheckoutEvent/makeRefundEvent factories for test data construction"

requirements-completed: [TEST-01]

duration: 20min
completed: 2026-02-26
---

# Plan 07-02: Checkout & Webhook Tests Summary

**41 tests covering checkout session creation (price validation, stock, coupons, Stripe session) and webhook handler (idempotent orders, stock decrement, refunds)**

## Performance

- **Duration:** 20 min
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Checkout test suite with 24 tests covering: empty cart, negative price, zero quantity, server-side price replacement, product/variant not found, inactive items, stock exceeded, 5 coupon failure modes, percentage/fixed discounts, session creation with metadata, shipping logic, Stripe errors
- Webhook integration test suite with 17 tests covering: signature validation, rate limiting, order creation, stock decrement RPC calls, coupon increment, idempotency, user association, shipping separation, refund handling, error scenarios
- Both test files use vi.hoisted() pattern for reliable mock variable access

## Task Commits

1. **Task 1: Checkout session test suite** - `1cb4baa`
2. **Task 2: Webhook handler test suite** - `1cb4baa`

## Files Created/Modified
- `tests/unit/actions/checkout.test.ts` - 24 tests for createCheckoutSession action
- `tests/integration/webhook.test.ts` - 17 tests for Stripe webhook POST handler

## Decisions Made
- vi.hoisted() pattern adopted after discovering ReferenceError with plain const declarations in vi.mock factories
- Custom helper functions preferred over shared mock factories for complex multi-table Supabase chains specific to checkout/webhook logic
- Webhook tests placed in tests/integration/ since they test full request handling through the route handler

## Deviations from Plan
None - plan executed as written

## Issues Encountered
None - vi.hoisted() pattern applied proactively based on learning from Plan 07-04

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core purchase flow fully tested (checkout + webhook)
- vi.hoisted() pattern documented for future test authoring

---
*Phase: 07-testing-foundation*
*Completed: 2026-02-26*
