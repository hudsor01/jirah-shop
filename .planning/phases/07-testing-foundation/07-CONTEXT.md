# Phase 7: Testing Foundation - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Critical code paths have automated test coverage and testing infrastructure is production-ready. Unit tests for checkout, webhook, auth guards, sanitization, cart, admin products. Coverage reporting configured. Playwright E2E framework installed with smoke test. Minimum 30% coverage on critical paths. This does NOT add documentation (Phase 8) or CI pipeline (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Test Infrastructure
- Vitest is already installed (v4.0.18) with config at `vitest.config.ts`
- Enable `v8` coverage provider in vitest config
- Create `tests/` directory structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Global test utilities in `tests/helpers/` (mock factories for Supabase client, Stripe client, etc.)
- Mock pattern: `vi.mock()` for external dependencies (Supabase, Stripe, Sentry)
- Existing 6 tests in `tests/storage.test.ts` must continue passing

### Test Suites Priority
- Checkout + webhook: highest priority -- these are the purchase flow (core value)
- Auth guards + sanitization: security-critical paths
- Admin products CRUD: business-critical
- Cart provider: client-side state management
- Utility functions (formatters): quick wins for coverage
- Snapshot tests for critical UI components: prevent regression

### Coverage Target
- Minimum 30% overall coverage (up from <2%)
- Critical paths (checkout, webhook, auth) should aim for 80%+
- Coverage reporting with `v8` provider, output to `coverage/` directory
- Add coverage script to package.json: `"test:coverage": "vitest run --coverage"`

### Playwright E2E
- Install Playwright with `bun add -d @playwright/test`
- Configure in `playwright.config.ts` with base URL pointing to local dev server
- Single smoke test: navigate to homepage, verify products load, add to cart, verify cart drawer opens
- E2E tests live in `tests/e2e/`
- Don't test Stripe checkout E2E (requires real credentials) -- stop at cart validation

### Claude's Discretion
- Exact mock factory implementations
- How many snapshot tests and which components
- Test file naming convention (`.test.ts` vs `.spec.ts` -- use `.test.ts` to match existing)
- Whether to use test fixtures or inline test data
- Playwright browser selection (chromium-only is fine for smoke test)

</decisions>

<specifics>
## Specific Ideas

- Only 6 tests exist currently in `tests/storage.test.ts` -- near-zero coverage
- `bun test` or `bun run vitest run` is the test command
- Mock pattern established: `vi.mock('@/lib/supabase/client')` works with module-level imports
- ActionResult<T> adoption (Phase 6) makes testing easier -- consistent return shapes
- Queries layer (Phase 6) enables testing data access independently

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 07-testing-foundation*
*Context gathered: 2026-02-26*
