# Phase 1: Critical Security Fixes - Research

**Completed:** 2026-02-26
**Status:** Research complete

## Requirement Analysis

Phase 1 addresses 8 security requirements: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-07, SEC-11, SEC-12.

### SEC-01: XSS via Unsanitized HTML Rendering
- **Current state:** Two unsafe HTML injection calls render DB content without sanitization:
  - `app/(storefront)/blog/[slug]/page.tsx` line 134: renders `post.content` as raw HTML
  - `app/(storefront)/product/[slug]/page.tsx` line 109: renders `product.description` as raw HTML
- **Note:** `components/ui/chart.tsx` lines 63/86 also use unsafe HTML injection but these are safe (developer-controlled CSS custom properties from ChartConfig, not user input). No change needed.
- **Fix:** Install `isomorphic-dompurify` + `@types/dompurify`, create `lib/sanitize.ts` with allowlist config per CONTEXT.md decisions, wrap both render sites.
- **Allowlist (from CONTEXT.md):** `h1-h6, p, br, strong, em, b, i, u, s, a[href|target|rel], ul, ol, li, blockquote, pre, code, img[src|alt|width|height], table, thead, tbody, tr, th, td, hr, span, div, figure, figcaption, sup, sub`. No `style`, `class`, `id` attributes. No `iframe`, `script`, `object`, `embed`, `form`, `input`.

### SEC-02: Blog Write-Time Sanitization (Defense-in-Depth)
- **Current state:** `actions/blog.ts` -- `createBlogPost()` (line 124) and `updateBlogPost()` (line 149) pass `formData.content` directly to Supabase insert/update without sanitization.
- **Fix:** Call `sanitizeRichHTML(formData.content)` before writing to DB in both `createBlogPost` and `updateBlogPost`. Same allowlist as SEC-01.

### SEC-03: Missing Auth Guard on updateProduct
- **Current state:** `actions/admin-products.ts` -- `updateProduct()` (line 203) calls `requireAdmin()` at line 211 (inside the try block), but `const supabase = await createClient()` at line 208 runs first. The guard is NOT the first statement.
- **Important nuance:** The guard IS present, but it's not the *first* line of the function. The requirement says "executes as the first line."
- **Fix:** Move `await requireAdmin()` to be the very first line of `updateProduct()`, before `createClient()`.
- **Pattern:** Other functions in the file (`getAdminProducts`, `getAdminProduct`, `createProduct`, `deleteProduct`) all have `await requireAdmin()` as their first line. `updateProduct` is the outlier.

### SEC-04: Checkout Error Message Information Leakage
- **Current state:** `actions/checkout.ts` -- Several `throw new Error()` calls leak sensitive data:
  - Line 67: Leaks exact stock counts
  - Line 99: Echoes the coupon code back
  - Line 103: Reveals coupon existence and expiry
  - Line 109: Reveals usage limits
  - Line 117: Reveals min order threshold
- **Fix:** Replace with generic messages per CONTEXT.md: "Item is currently unavailable", "Coupon is not valid". Log specifics via `logger.error()` / `logger.warn()` with Sentry context.

### SEC-05: devSignIn Missing Secondary Guard
- **Current state:** `actions/dev-auth.ts` -- `devSignIn()` only checks `process.env.NODE_ENV !== "development"` (line 15). Missing `ALLOW_DEV_AUTH` env flag check.
- **Fix:** Add `process.env.ALLOW_DEV_AUTH !== "true"` as second condition. If either fails, return error (don't throw).

### SEC-07: Checkout Success Page IDOR
- **Current state:** `app/(storefront)/checkout/success/page.tsx` -- Takes `session_id` from searchParams and retrieves the Stripe session directly. No ownership verification. Any user with a valid session_id can view another user's order details.
- **Fix:** After retrieving the Stripe session, get the authenticated user from Supabase. Compare `session.customer_details.email` with the authenticated user's email. If they don't match, show a generic "Order Not Found" page. Guest checkout (no auth) still works.
- **Consideration:** Guest checkout is supported. The fix needs to handle: (1) logged-in user viewing own order -- allow, (2) guest viewing own order -- allow (no auth to check), (3) logged-in user trying to view someone else's order -- block.

### SEC-11: Coupon Validation Returns Specific Error Details
- **Current state:** Same as SEC-04 coupon errors -- different error messages for different failure modes let attackers enumerate coupon states.
- **Fix:** Collapse all coupon failure modes to a single generic message: "Coupon is not valid." Log the specific reason server-side.

### SEC-12: Webhook Uses Raw process.env for STRIPE_WEBHOOK_SECRET
- **Current state:** `app/api/webhooks/stripe/route.ts` line 32: uses `process.env.STRIPE_WEBHOOK_SECRET!` with non-null assertion instead of validated `env.STRIPE_WEBHOOK_SECRET` from `lib/env.ts`.
- **Fix:** Import `env` from `@/lib/env` and use `env.STRIPE_WEBHOOK_SECRET`. The validated env module already requires this variable and will throw at cold start if missing.

## Codebase Architecture Notes

### Files Modified Per Plan (Dependency Map)
- **Plan 01 (Sanitization):**
  - NEW: `lib/sanitize.ts`
  - MODIFY: `app/(storefront)/blog/[slug]/page.tsx` (import + wrap)
  - MODIFY: `app/(storefront)/product/[slug]/page.tsx` (import + wrap)
  - MODIFY: `actions/blog.ts` (sanitize at write-time in create + update)
  - INSTALL: `isomorphic-dompurify`, `@types/dompurify`

- **Plan 02 (Auth Guards):**
  - MODIFY: `actions/admin-products.ts` (move requireAdmin in updateProduct)
  - MODIFY: `actions/dev-auth.ts` (add ALLOW_DEV_AUTH check)
  - MODIFY: `app/(storefront)/checkout/success/page.tsx` (add session ownership check)

- **Plan 03 (Error Messages):**
  - MODIFY: `actions/checkout.ts` (generic errors + Sentry logging)
  - MODIFY: `app/api/webhooks/stripe/route.ts` (use validated env)

### No Cross-Plan Dependencies
- Plans can run in parallel (different files, no shared new code).
- Exception: Plan 01 creates `lib/sanitize.ts` which Plans 02 and 03 don't need.
- Plan 02's checkout success page change is independent of Plan 03's checkout action changes.

### Testing Considerations
- Testing is Phase 7 scope. Phase 1 plans should NOT include test writing.
- But plans should ensure changes don't break existing behavior.

### Package Installation
- `isomorphic-dompurify` works in both server and client contexts (SSR-compatible).
- `@types/dompurify` for TypeScript types.
- No other new dependencies needed.

## Risk Assessment

- **Low risk:** All changes are additive security hardening. No schema changes, no API shape changes.
- **One concern:** Checkout error messages change from specific to generic. Verified that cart drawer and cart page use toast notifications but don't parse specific error text. Safe to change.

## RESEARCH COMPLETE
