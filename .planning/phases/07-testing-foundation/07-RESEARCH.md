# Phase 7: Testing Foundation - Research

**Researched:** 2026-02-26
**Domain:** Testing infrastructure, unit/integration/E2E test suites for Next.js + Supabase + Stripe
**Confidence:** HIGH

## Summary

Phase 7 builds automated test coverage for a Next.js 16 e-commerce app using Vitest (already installed v4.0.18) for unit/integration tests and Playwright for E2E. The codebase has 11 server action files, 6 query modules, auth/sanitize/format utilities, a cart provider with localStorage persistence, and a Stripe webhook handler. Currently only 6 tests exist in `tests/storage.test.ts`.

The established mock pattern (`vi.mock()` with hoisted factory) works well and should be extended to create reusable mock factories for Supabase client, Stripe client, and Next.js server APIs. The ActionResult<T> discriminated union (Phase 6) makes assertions clean — every server action returns `{ success: true, data }` or `{ success: false, error }`.

**Primary recommendation:** Build mock factories first (Wave 1), then test suites in priority order (checkout/webhook highest, then auth/sanitization, then admin/cart), then Playwright E2E last since it depends on a running dev server.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Vitest is already installed (v4.0.18) with config at `vitest.config.ts`
- Enable `v8` coverage provider in vitest config
- Create `tests/` directory structure: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- Global test utilities in `tests/helpers/` (mock factories for Supabase client, Stripe client, etc.)
- Mock pattern: `vi.mock()` for external dependencies (Supabase, Stripe, Sentry)
- Existing 6 tests in `tests/storage.test.ts` must continue passing
- Minimum 30% overall coverage (up from <2%)
- Critical paths (checkout, webhook, auth) should aim for 80%+
- Coverage reporting with `v8` provider, output to `coverage/` directory
- Add coverage script to package.json: `"test:coverage": "vitest run --coverage"`
- Install Playwright with `bun add -d @playwright/test`
- Configure in `playwright.config.ts`
- Single smoke test: navigate to homepage, verify products load, add to cart, verify cart drawer opens
- E2E tests live in `tests/e2e/`
- Don't test Stripe checkout E2E — stop at cart validation

### Claude's Discretion
- Exact mock factory implementations
- How many snapshot tests and which components
- Test file naming convention (`.test.ts` vs `.spec.ts` — use `.test.ts` to match existing)
- Whether to use test fixtures or inline test data
- Playwright browser selection (chromium-only is fine for smoke test)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TEST-01 | Checkout + webhook test suite with mocked Supabase and Stripe clients | Mock factories + checkout action testing patterns + webhook route testing |
| TEST-02 | Auth guards + sanitization test suite | requireAdmin mock pattern, DOMPurify mock, sanitizeRedirect/sanitizeSearchInput pure function tests |
| TEST-03 | Admin product CRUD test suite including Stripe sync and partial failure | Mock Stripe + Supabase, test createProduct/updateProduct/deleteProduct with rollback scenarios |
| TEST-04 | Cart provider test suite with localStorage persistence | React Testing Library renderHook pattern, localStorage mock |
| TEST-05 | Vitest coverage reporting configured with `v8` provider | @vitest/coverage-v8 package, vitest.config.ts coverage block |
| TEST-06 | Playwright E2E framework installed and configured | @playwright/test package, playwright.config.ts, smoke test pattern |
| TEST-07 | Global test utilities established in vitest setup | tests/helpers/ mock factories, vitest.setup.ts enhancements |
| TEST-08 | `formatPrice`, `formatDate`, `formatDateLong` utility tests | Pure function tests, locale-sensitive assertions |
| TEST-09 | Snapshot tests for critical UI components | React Testing Library render + toMatchSnapshot |
| TEST-10 | Module-level mock pattern in `storage.test.ts` improved | vi.mock hoisting improvements |
| TEST-11 | Tests for blog CRUD, coupon management, order management, reviews, settings | Server action testing with ActionResult assertions |
| TEST-12 | Minimum 30% code coverage achieved on critical paths | Coverage threshold config in vitest.config.ts |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | 4.0.18 | Test runner | Already installed, fast, native ESM, good Vite integration |
| @vitest/coverage-v8 | ^4.0 | Coverage reporting | User-specified v8 provider, pairs with vitest |
| @testing-library/react | 16.3.2 | React component testing | Already installed, standard for React testing |
| @testing-library/jest-dom | 6.9.1 | DOM matchers | Already installed, provides toBeInTheDocument etc. |
| @testing-library/user-event | 14.6.1 | User interaction simulation | Already installed, async event simulation |
| @playwright/test | latest | E2E testing | User-specified, industry standard for E2E |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitejs/plugin-react | (installed) | JSX transform for tests | Already in vitest.config.ts |

### Alternatives Considered
None — stack is locked by user decisions. All core libraries already installed except @vitest/coverage-v8 and @playwright/test.

**Installation:**
```bash
bun add -d @vitest/coverage-v8 @playwright/test
bunx playwright install chromium
```

## Architecture Patterns

### Recommended Test Directory Structure
```
tests/
├── helpers/
│   ├── mock-supabase.ts     # Supabase client mock factory
│   ├── mock-stripe.ts       # Stripe client mock factory
│   ├── mock-next.ts         # Next.js server API mocks (cookies, headers, cache)
│   ├── fixtures.ts          # Reusable test data (products, orders, cart items)
│   └── render-with-providers.tsx  # Custom render with CartProvider wrapper
├── unit/
│   ├── lib/
│   │   ├── format.test.ts
│   │   ├── sanitize.test.ts
│   │   ├── auth.test.ts
│   │   ├── action-result.test.ts
│   │   └── validations.test.ts
│   ├── actions/
│   │   ├── checkout.test.ts
│   │   ├── admin-products.test.ts
│   │   ├── blog.test.ts
│   │   ├── coupons.test.ts
│   │   ├── orders.test.ts
│   │   ├── reviews.test.ts
│   │   ├── settings.test.ts
│   │   └── contact.test.ts
│   ├── providers/
│   │   └── cart-provider.test.tsx
│   └── components/
│       └── __snapshots__/
├── integration/
│   └── webhook.test.ts
├── e2e/
│   └── smoke.spec.ts
└── storage.test.ts           # Existing — must keep passing
```

### Pattern 1: Server Action Testing with ActionResult
**What:** Test server actions that return ActionResult<T> by mocking dependencies and asserting on success/error discrimination.
**When to use:** All server action tests.
**Example:**
```typescript
// Mock dependencies
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

it('returns success with checkout URL', async () => {
  // Arrange: set up mock returns
  mockSupabase.from.mockReturnValue(chainable({ data: mockProducts }));
  mockStripe.checkout.sessions.create.mockResolvedValue({ url: 'https://stripe.com/pay' });

  // Act
  const result = await createCheckoutSession(mockCartItems);

  // Assert
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data.url).toBe('https://stripe.com/pay');
  }
});
```

### Pattern 2: Webhook Route Testing
**What:** Test Next.js API route handlers by constructing NextRequest objects and calling the exported handler directly.
**When to use:** Webhook and API route tests.
**Example:**
```typescript
import { POST } from '@/app/api/webhooks/stripe/route';

it('processes checkout.session.completed', async () => {
  const request = new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    body: JSON.stringify(mockEvent),
    headers: { 'stripe-signature': 'valid_sig' },
  });

  const response = await POST(request);
  expect(response.status).toBe(200);
});
```

### Pattern 3: Cart Provider Hook Testing
**What:** Test React context providers using renderHook with wrapper.
**When to use:** CartProvider tests.
**Example:**
```typescript
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/providers/cart-provider';

function wrapper({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}

it('adds item to cart', () => {
  const { result } = renderHook(() => useCart(), { wrapper });
  act(() => result.current.addItem(mockCartItem));
  expect(result.current.items).toHaveLength(1);
});
```

### Pattern 4: Supabase Chain Mock
**What:** Mock Supabase's chainable query builder (`.from().select().eq().single()`).
**When to use:** Any test that calls Supabase.
**Example:**
```typescript
function createMockSupabaseClient() {
  const chainable = (result: { data?: unknown; error?: unknown }) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(result),
    then: vi.fn((cb) => cb(result)),
  });

  return {
    from: vi.fn((table: string) => chainable({ data: null })),
    auth: { getUser: vi.fn() },
    rpc: vi.fn(),
  };
}
```

### Anti-Patterns to Avoid
- **Testing implementation details:** Don't assert on internal state shape — assert on behavior (return values, side effects)
- **Coupling tests to Supabase query chain order:** Mock at the return level, not method-call-by-method-call
- **Snapshot overuse:** Only snapshot stable UI components, not data-driven components that change frequently
- **Testing Next.js internals:** Don't test `revalidatePath` was called with exact args — test that the action succeeds

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| DOM assertions | Custom matchers | @testing-library/jest-dom | Handles edge cases (visibility, accessibility) |
| User events | Direct fireEvent | @testing-library/user-event | Simulates real browser behavior (focus, typing) |
| React hook testing | Custom wrapper | renderHook from @testing-library/react | Handles act() boundaries, async updates |
| Coverage reporting | Custom scripts | @vitest/coverage-v8 | Integrated with vitest, supports thresholds |
| E2E browser automation | Puppeteer/custom | @playwright/test | Handles waits, retries, multi-browser |

## Common Pitfalls

### Pitfall 1: Module-Level Side Effects in Server Actions
**What goes wrong:** Server actions import modules with side effects (Supabase client creation, Stripe initialization) at module level. `vi.mock()` must be hoisted above these imports.
**Why it happens:** Vitest processes mocks before imports, but incorrect mock placement breaks this.
**How to avoid:** Always use `vi.mock()` at the top level (never inside describe/it). Use factory functions that return mock objects.
**Warning signs:** Tests pass individually but fail in suite; "Cannot access X before initialization" errors.

### Pitfall 2: Async State Updates in React Hook Tests
**What goes wrong:** Cart provider state updates (localStorage hydration, addItem) are async. Tests that assert synchronously get stale state.
**Why it happens:** React batches state updates. `useEffect` for hydration runs after first render.
**How to avoid:** Wrap mutations in `act()`. Use `waitFor()` for async effects. Check `hydrated` state before asserting.
**Warning signs:** Tests pass with `setTimeout` but fail without — sign of timing dependency.

### Pitfall 3: Next.js Server-Only Modules in Test Environment
**What goes wrong:** Importing server actions that use `next/headers`, `next/cache`, or React `cache()` fails in jsdom test environment.
**Why it happens:** These modules check for server context and throw in client environments.
**How to avoid:** Mock `next/headers`, `next/cache`, and `react` cache function in vitest.setup.ts or per-test mocks.
**Warning signs:** "Cannot read properties of undefined" or "headers() cannot be called outside of a Server Component".

### Pitfall 4: DOMPurify in Test Environment
**What goes wrong:** `isomorphic-dompurify` depends on a DOM implementation. jsdom provides one, but behavior may differ.
**Why it happens:** DOMPurify relies on browser DOM APIs that jsdom emulates imperfectly.
**How to avoid:** Test sanitization with real DOMPurify (no mock needed in jsdom). Verify output strings directly.
**Warning signs:** Tests pass but sanitization behaves differently in real browsers.

### Pitfall 5: Playwright and Next.js Dev Server
**What goes wrong:** E2E tests fail because dev server isn't running or port conflicts.
**Why it happens:** Playwright needs a running app to test against.
**How to avoid:** Configure `webServer` in `playwright.config.ts` to start/stop dev server automatically.
**Warning signs:** Connection refused errors, random port binding failures.

## Code Examples

### Vitest Coverage Configuration
```typescript
// vitest.config.ts update
export default defineConfig({
  // ...existing config
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: ['actions/**', 'lib/**', 'providers/**', 'queries/**', 'app/api/**'],
      exclude: ['**/*.d.ts', 'tests/**', '**/*.config.*'],
      thresholds: {
        lines: 30,
        branches: 30,
        functions: 30,
        statements: 30,
      },
    },
  },
});
```

### Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Mock Next.js Server APIs
```typescript
// tests/helpers/mock-next.ts
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}));
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jest with Next.js | Vitest with @vitejs/plugin-react | 2023-2024 | Faster tests, native ESM |
| istanbul coverage | v8 coverage | Vitest 1.0+ | Faster, more accurate, built into V8 |
| Cypress for E2E | Playwright | 2023-2024 | Faster, better parallelism, less flaky |
| enzyme for React | @testing-library/react | 2020+ | Tests behavior not implementation |

## Open Questions

1. **Coverage threshold enforcement**
   - What we know: vitest supports `thresholds` config to fail CI if coverage drops below target
   - What's unclear: Whether 30% overall is achievable given many UI components won't have tests
   - Recommendation: Set 30% threshold, run coverage after all tests written, adjust if needed

2. **Snapshot test component selection**
   - What we know: Need snapshots for "critical UI components"
   - What's unclear: Which components are critical enough for snapshots
   - Recommendation: Product card, cart drawer/summary, checkout success page — components that render data from server

## Sources

### Primary (HIGH confidence)
- Codebase analysis: vitest.config.ts, package.json, existing tests, all server action files
- Vitest documentation (built-in knowledge + installed version v4.0.18)
- @testing-library/react documentation (installed v16.3.2)

### Secondary (MEDIUM confidence)
- Playwright configuration patterns for Next.js projects
- Supabase mock patterns from community usage

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed/specified
- Architecture: HIGH - patterns derived from actual codebase analysis
- Pitfalls: HIGH - based on real module-level import patterns in this codebase

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (stable — testing patterns don't change rapidly)
