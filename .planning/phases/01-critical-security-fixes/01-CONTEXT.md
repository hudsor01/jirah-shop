# Phase 1: Critical Security Fixes - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate XSS, auth bypass, IDOR, and information leakage vulnerabilities. All known security issues that expose user data or enable code injection are fixed. This phase does NOT add new security features (rate limiting, Zod validation) -- those are Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Sanitization Allowlist
- Use `isomorphic-dompurify` for both server and client contexts
- Blog content allowlist (rich text): `h1-h6, p, br, strong, em, b, i, u, s, a[href|target|rel], ul, ol, li, blockquote, pre, code, img[src|alt|width|height], table, thead, tbody, tr, th, td, hr, span, div, figure, figcaption, sup, sub`
- Product descriptions: same allowlist as blog (they share the rich text editor)
- All other user-generated text (reviews, contact form, names): plain text only -- strip ALL HTML
- No `style` attributes, no `class` attributes, no `id` attributes on sanitized content
- No `iframe`, `script`, `object`, `embed`, `form`, `input` tags ever
- Create `lib/sanitize.ts` with exported functions: `sanitizeRichHTML(html)` for blog/product content, and `sanitizeText(text)` for plain text fields
- Apply at render-time (defense layer 1) AND at write-time for blog content (defense layer 2, defense-in-depth)

### Error Message Behavior
- Checkout errors show generic messages only: "Unable to complete checkout", "Item is currently unavailable", "Coupon is not valid"
- Never expose: stock counts ("only 3 left"), coupon codes, discount percentages, internal error details, stack traces
- Success paths can be specific: "Order placed successfully", "Coupon applied: 20% off"
- Webhook errors: generic "Payment processing error" to client; full details server-side only
- Form validation errors can be specific about what's wrong: "Email format is invalid", "Password must be 8+ characters" (these aren't sensitive)

### Logging Strategy
- All sensitive error details go to Sentry via `Sentry.captureException()` with structured context
- Use `Sentry.setContext()` to attach: stock quantities, coupon details, order IDs, session info
- Never `console.log` sensitive business data in production -- Sentry only
- Existing Sentry integration (client, server, edge configs) is already in place -- just use it
- Log levels: `captureException` for errors, `captureMessage` with severity for warnings (e.g., "Stock insufficient for order X")
- Webhook endpoint: verify `STRIPE_WEBHOOK_SECRET` env var exists at startup, log clear error if missing

### Dev Auth Guard Scope
- `devSignIn` requires BOTH `NODE_ENV === "development"` AND `ALLOW_DEV_AUTH === "true"` env flag
- `ALLOW_DEV_AUTH` applies ONLY to the dev sign-in action -- no other features gated by it
- If either condition fails, return error (don't silently succeed)
- Checkout success page: verify the session's customer email matches the authenticated user -- prevent IDOR where user A can view user B's order confirmation by guessing session IDs

### Claude's Discretion
- Exact DOMPurify configuration options beyond the allowlist (e.g., RETURN_DOM_FRAGMENT, RETURN_TRUSTED_TYPE)
- Whether to create a shared sanitization wrapper component or use the lib functions directly
- Error message exact wording (as long as it follows the generic/specific rules above)
- How to structure the Sentry context attachments (flat vs nested)

</decisions>

<specifics>
## Specific Ideas

- The code review identified React's unsafe HTML injection API used in `BlogContent`, `ProductDescription`, and `ReviewContent` components -- these are the primary XSS vectors
- `updateProduct` server action is missing `requireAdmin()` guard -- this is the auth bypass (CRIT-03)
- Blog admin write path should sanitize content before storing to database, not just at render (defense-in-depth per SEC-02)
- Checkout success page at `/checkout/success` takes a session_id param -- must verify ownership (SEC-12)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-critical-security-fixes*
*Context gathered: 2026-02-26*
