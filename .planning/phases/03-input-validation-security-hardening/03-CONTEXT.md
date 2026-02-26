# Phase 3: Input Validation & Security Hardening - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

All server action inputs are validated at runtime before business logic executes. Password policy enforced. Contact form validated. Rate limiting on critical endpoints. This does NOT change error return types (Phase 6 handles ActionResult adoption) -- Zod validation here returns early with existing error shapes.

</domain>

<decisions>
## Implementation Decisions

### Zod Schema Strategy
- Every server action gets a Zod schema that validates input before any DB or Stripe call
- Use `safeParse()` (not `parse()`) -- return error on failure, don't throw
- Schemas co-located with their action files (not a separate schemas/ directory) for discoverability
- For actions that already have partial validation (e.g., webhook has Zod), extend/improve the existing schema
- Reuse schema fragments where sensible (e.g., `emailSchema = z.string().email()` shared across auth + contact)
- Zod is already installed (v4.3.6) -- no new dependency needed

### Validation Error Responses
- Return existing error shapes for now (Phase 6 will unify to ActionResult)
- Validation errors should be user-readable: "Email must be a valid email address", "Password must be at least 8 characters"
- Don't expose schema internals or Zod error paths to the client

### Password Policy
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- Implemented as Zod schema with `.min(8)` and `.regex()` checks
- Applied in the registration/signup server action
- Error messages should explain each requirement that fails

### Rate Limiting
- Use `@upstash/ratelimit` with Vercel KV (or in-memory for dev) -- this is the standard Next.js approach
- Apply to: auth endpoints (login, register), webhook endpoint, contact form, review submission
- Limits: auth = 5 requests/minute per IP, webhook = 100/minute (Stripe sends bursts), contact = 3/minute, reviews = 5/minute
- Return 429 with generic "Too many requests, please try again later" message
- Rate limiter instance created in `lib/rate-limit.ts` as reusable utility

### Claude's Discretion
- Exact Zod schema field definitions for each action (infer from existing types and DB schema)
- Whether to use sliding window or fixed window rate limiting
- Order of applying Zod schemas across the 11 action files (any order is fine)
- Whether rate limiting uses IP-based or session-based identification

</decisions>

<specifics>
## Specific Ideas

- 11 action files need Zod schemas: auth, checkout, admin-products, admin-orders, admin-customers, admin-blog, admin-coupons, admin-reviews, admin-settings, contact, dev-auth
- Zod is installed but only used in the webhook handler currently
- Contact form currently has no email format validation (SEC-09)
- Registration has no password strength requirements (SEC-08)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 03-input-validation-security-hardening*
*Context gathered: 2026-02-26*
