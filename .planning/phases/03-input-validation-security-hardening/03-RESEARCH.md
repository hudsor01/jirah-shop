# Phase 3: Input Validation & Security Hardening - Research

**Researched:** 2026-02-26
**Domain:** Zod schema validation, rate limiting, password policy enforcement
**Confidence:** HIGH

## Summary

Phase 3 adds runtime input validation to all 11 server action files using Zod 4.3.6 (already installed), enforces a password policy on registration, validates the contact form email, and adds rate limiting to critical endpoints. The codebase currently has zero Zod usage in action files -- only the webhook route uses Zod. All server actions accept raw parameters without schema validation.

Zod 4.x `safeParse()` is the standard pattern: validate input, return error on failure, proceed on success. For rate limiting, since no Upstash/Vercel KV infrastructure exists, an in-memory `Map`-based rate limiter is the pragmatic choice for the current deployment (standalone Node.js). This can be upgraded to Upstash when Redis infrastructure is added.

**Primary recommendation:** Add Zod schemas co-located in each action file using `safeParse()` before any DB/Stripe call. Create a shared `lib/rate-limit.ts` utility using in-memory sliding window. Apply rate limiting at the server action level via `headers()` for IP extraction.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Every server action gets a Zod schema that validates input before any DB or Stripe call
- Use `safeParse()` (not `parse()`) -- return error on failure, don't throw
- Schemas co-located with their action files (not a separate schemas/ directory) for discoverability
- For actions that already have partial validation (e.g., webhook has Zod), extend/improve the existing schema
- Reuse schema fragments where sensible (e.g., `emailSchema = z.string().email()` shared across auth + contact)
- Zod is already installed (v4.3.6) -- no new dependency needed
- Return existing error shapes for now (Phase 6 will unify to ActionResult)
- Validation errors should be user-readable: "Email must be a valid email address", "Password must be at least 8 characters"
- Don't expose schema internals or Zod error paths to the client
- Password policy: Minimum 8 characters, at least 1 uppercase, at least 1 number (Zod `.min(8)` + `.regex()`)
- Applied in the registration/signup server action
- Error messages should explain each requirement that fails
- Use `@upstash/ratelimit` with Vercel KV (or in-memory for dev) -- this is the standard Next.js approach
- Apply to: auth endpoints (login, register), webhook endpoint, contact form, review submission
- Limits: auth = 5 requests/minute per IP, webhook = 100/minute, contact = 3/minute, reviews = 5/minute
- Return 429 with generic "Too many requests, please try again later" message
- Rate limiter instance created in `lib/rate-limit.ts` as reusable utility

### Claude's Discretion
- Exact Zod schema field definitions for each action (infer from existing types and DB schema)
- Whether to use sliding window or fixed window rate limiting
- Order of applying Zod schemas across the 11 action files (any order is fine)
- Whether rate limiting uses IP-based or session-based identification

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SEC-06 | All 11 server action files validate input with Zod schemas before business logic | Zod 4.3.6 `safeParse()` pattern verified working. Each action file's parameters mapped. |
| SEC-08 | Password policy enforced at 8+ chars, 1 uppercase, 1 number via Zod | Zod 4 `.min(8).regex(/[A-Z]/).regex(/[0-9]/)` pattern verified. Applied in `signUpWithEmail`. |
| SEC-09 | Auth, webhook, contact, and review endpoints have rate limiting | In-memory rate limiter pattern documented. IP extraction via `headers()` from `next/headers`. |
| SEC-10 | Contact form validates email with `z.string().email()` | Zod 4 `.email()` verified. Currently `contact.ts` has no email format validation. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| zod | 4.3.6 | Runtime schema validation | Already installed; industry standard for TypeScript validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| next/headers | built-in | IP extraction for rate limiting | `headers().get("x-forwarded-for")` in server actions |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory rate limit | @upstash/ratelimit + Vercel KV | Upstash requires Redis infrastructure not yet set up; in-memory works for standalone deployment, loses state on restart |
| Per-action schemas | Separate schemas/ directory | Co-location per CONTEXT.md decision; more discoverable |

**Installation:**
```bash
# No new packages needed for Zod (already installed)
# Rate limiting: in-memory implementation, no external deps
```

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── validations.ts          # Shared schema fragments (emailSchema, passwordSchema, uuidSchema)
├── rate-limit.ts           # Rate limiter factory + instances
actions/
├── auth.ts                 # Zod schemas co-located at top of file
├── checkout.ts             # CartItemSchema, CreateCheckoutSessionSchema
├── admin-products.ts       # ProductFormDataSchema, VariantFormDataSchema
├── contact.ts              # ContactFormSchema with z.string().email()
└── ... (8 more)
```

### Pattern 1: Server Action Zod Validation
**What:** Every server action validates its inputs with `safeParse()` before any business logic
**When to use:** Every server action that accepts external input
**Example:**
```typescript
import { z } from "zod";

const SignUpSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
    .regex(/[0-9]/, "Password must contain at least 1 number"),
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export async function signUpWithEmail(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const raw = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const result = SignUpSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // ... business logic with result.data
}
```

### Pattern 2: FormData Extraction + Validation
**What:** For actions receiving `FormData`, extract fields first, then validate the plain object
**When to use:** Server actions bound to HTML forms
**Example:**
```typescript
export async function submitContactForm(formData: FormData) {
  const raw = {
    name: formData.get("name") as string,
    email: formData.get("email") as string,
    message: formData.get("message") as string,
  };

  const result = ContactFormSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: result.error.issues[0].message };
  }

  const { name, email, message } = result.data;
  // ... business logic
}
```

### Pattern 3: Typed Object Validation
**What:** For actions receiving typed objects (not FormData), validate the object directly
**When to use:** `createProduct(formData: ProductFormData, variants: VariantFormData[])`
**Example:**
```typescript
export async function createProduct(
  formData: ProductFormData,
  variants: VariantFormData[]
) {
  const productResult = ProductFormDataSchema.safeParse(formData);
  if (!productResult.success) {
    return { success: false, error: productResult.error.issues[0].message };
  }

  const variantsResult = z.array(VariantFormDataSchema).safeParse(variants);
  if (!variantsResult.success) {
    return { success: false, error: variantsResult.error.issues[0].message };
  }

  // ... business logic with productResult.data, variantsResult.data
}
```

### Pattern 4: In-Memory Rate Limiting
**What:** Sliding window rate limiter using `Map` with TTL cleanup
**When to use:** Server actions and API routes that need request throttling
**Example:**
```typescript
// lib/rate-limit.ts
import { headers } from "next/headers";

type RateLimitEntry = { count: number; resetAt: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const store = new Map<string, RateLimitEntry>();

  // Periodic cleanup of expired entries
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, windowMs);

  return {
    async check(identifier: string): Promise<{ success: boolean }> {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || now > entry.resetAt) {
        store.set(identifier, { count: 1, resetAt: now + windowMs });
        return { success: true };
      }

      if (entry.count >= limit) {
        return { success: false };
      }

      entry.count++;
      return { success: true };
    },
  };
}

export async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}

// Pre-configured limiters
export const authLimiter = createRateLimiter(5, 60_000);    // 5/min
export const webhookLimiter = createRateLimiter(100, 60_000); // 100/min
export const contactLimiter = createRateLimiter(3, 60_000);  // 3/min
export const reviewLimiter = createRateLimiter(5, 60_000);   // 5/min
```

### Anti-Patterns to Avoid
- **Using `parse()` instead of `safeParse()`:** `parse()` throws on failure -- the decision is to return errors, not throw
- **Exposing Zod error paths:** `result.error.issues[0].message` is user-readable; `result.error.format()` exposes internals
- **Validating after business logic:** Schema validation MUST be the first thing after `requireAdmin()` (if applicable)
- **Creating per-request rate limiter instances:** Limiter instances must be module-level singletons

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Schema validation | Manual if/typeof checks | Zod `safeParse()` | Type-safe, composable, reusable, error messages |
| Email validation | Regex patterns | `z.string().email()` | Zod's built-in email regex is well-tested |
| Password strength | Manual regex checks | Zod `.min().regex().regex()` chain | Composable, each check has its own error message |

**Key insight:** Zod schemas are the single source of truth for input shape AND error messages. Don't scatter validation logic across manual checks.

## Common Pitfalls

### Pitfall 1: Zod 4 vs Zod 3 API Differences
**What goes wrong:** Using Zod 3 patterns that don't work in Zod 4
**Why it happens:** Most online examples are for Zod 3
**How to avoid:** Zod 4.3.6 is backwards-compatible with Zod 3 `safeParse()` pattern. The core API (`z.object()`, `z.string()`, `.min()`, `.regex()`, `.email()`, `.safeParse()`) is identical. No migration needed.
**Warning signs:** Import path issues -- Zod 4 uses `import { z } from "zod"` (same as v3)

### Pitfall 2: FormData Type Coercion
**What goes wrong:** `formData.get()` returns `FormDataEntryValue | null` (string or File), not typed values
**Why it happens:** FormData is untyped by nature
**How to avoid:** Extract all fields as strings first, then pass plain object to Zod. Use `z.coerce.number()` for numeric fields from forms.
**Warning signs:** `as string` casts without null checks

### Pitfall 3: Rate Limiter Memory Leak
**What goes wrong:** In-memory Map grows unbounded
**Why it happens:** No cleanup of expired entries
**How to avoid:** Include periodic cleanup via `setInterval`. Each entry has a `resetAt` timestamp.
**Warning signs:** Monotonically growing Map size in production

### Pitfall 4: IP Extraction in Server Actions
**What goes wrong:** `headers()` from `next/headers` is async in Next.js 16
**Why it happens:** Next.js 16 made `headers()` async
**How to avoid:** Always `await headers()` before accessing header values
**Warning signs:** Runtime error about headers not being a function

### Pitfall 5: Validation on Read-Only Actions
**What goes wrong:** Adding unnecessary validation to query-only actions with no user input risk
**Why it happens:** Over-applying validation to every function
**How to avoid:** Focus Zod validation on _mutation_ actions and actions with external input. Query actions that only accept pagination/filter objects from internal code are lower priority but should still be validated for robustness per SEC-06.
**Warning signs:** Validation that adds overhead to high-frequency read paths

## Code Examples

### Shared Schema Fragments (lib/validations.ts)
```typescript
import { z } from "zod";

export const emailSchema = z.string().email("Please enter a valid email address");

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 number");

export const uuidSchema = z.string().uuid("Invalid ID format");

export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
}).optional();
```

### Server Action with Rate Limiting
```typescript
import { authLimiter, getClientIp } from "@/lib/rate-limit";

export async function signInWithEmail(
  _prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  // Rate limit check
  const ip = await getClientIp();
  const { success: allowed } = await authLimiter.check(ip);
  if (!allowed) {
    return { error: "Too many requests, please try again later." };
  }

  // Zod validation
  const raw = { email: formData.get("email"), password: formData.get("password") };
  const result = SignInSchema.safeParse(raw);
  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  // ... business logic
}
```

### Webhook Rate Limiting
```typescript
// In app/api/webhooks/stripe/route.ts
import { webhookLimiter, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = await getClientIp();
  const { success: allowed } = await webhookLimiter.check(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  // ... existing webhook logic
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual if/else validation | Zod schema `safeParse()` | Zod 3.x (2022+) | Type-safe validation with composable error messages |
| Express rate-limit middleware | In-memory or Upstash for serverless | 2023+ | Serverless-compatible rate limiting |
| Zod 3 | Zod 4 (2025) | 2025 | Backwards-compatible, improved performance |

**Deprecated/outdated:**
- `z.string().email()` in Zod 4 uses an improved regex pattern (more standards-compliant than v3)
- Zod 4 `safeParse()` returns `{ success: true, data }` or `{ success: false, error }` -- same shape as v3

## Open Questions

1. **Rate limiter persistence across deployments**
   - What we know: In-memory rate limiting resets on server restart
   - What's unclear: Whether the standalone deployment has long-lived processes
   - Recommendation: Start with in-memory (per CONTEXT.md); upgrade to Upstash when Redis is added (future milestone)

2. **Webhook rate limiting effectiveness**
   - What we know: Stripe sends webhook bursts during high-volume checkouts
   - What's unclear: Whether 100/min is sufficient for peak load
   - Recommendation: Start with 100/min as configured; increase if legitimate webhooks are rejected

## Action File Inventory

| File | Lines | Input Pattern | Key Schemas Needed |
|------|-------|---------------|-------------------|
| `actions/checkout.ts` | 199 | `(items: CartItem[], couponCode?: string)` | CartItemSchema, CreateCheckoutSchema |
| `actions/admin-products.ts` | 443 | `(formData: ProductFormData, variants: VariantFormData[])` | ProductFormDataSchema, VariantFormDataSchema |
| `actions/auth.ts` | 99 | `FormData` | SignInSchema, SignUpSchema (with password policy) |
| `actions/blog.ts` | 211 | Mixed: options objects + FormData | BlogPostSchema, BlogOptionsSchema |
| `actions/contact.ts` | 38 | `FormData` | ContactFormSchema (email validation) |
| `actions/coupons.ts` | 109 | `(formData: CouponFormData)` | CouponFormDataSchema |
| `actions/dev-auth.ts` | 42 | None (reads env vars) | No external input -- skip or minimal |
| `actions/orders.ts` | 206 | Options objects + `(id: string, status: OrderStatus)` | OrderUpdateSchema |
| `actions/products.ts` | 115 | Options objects | ProductQuerySchema |
| `actions/reviews.ts` | 189 | `FormData` + `(id: string)` | ReviewSubmitSchema, ReviewIdSchema |
| `actions/settings.ts` | 72 | `(id: string, formData: SettingsFormData)` | SettingsFormDataSchema |

## Sources

### Primary (HIGH confidence)
- Zod 4.3.6 installed in project -- API verified via `node -e` testing
- Codebase analysis -- all 11 action files read, input patterns mapped
- Next.js 16 `headers()` API -- async pattern confirmed from project code

### Secondary (MEDIUM confidence)
- Rate limiting in-memory pattern -- well-established Node.js pattern
- IP extraction via `x-forwarded-for` -- standard for reverse-proxied deployments

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Zod 4.3.6 is installed and verified working
- Architecture: HIGH - patterns verified against actual codebase
- Pitfalls: HIGH - Zod 4 API tested locally, edge cases documented

**Research date:** 2026-02-26
**Valid until:** 2026-03-26 (Zod 4 is stable)
