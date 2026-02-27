---
plan: 01
status: done
commits:
  - f7e7aa5  # Task 1: auth.ts + dev-auth.ts
  - 0bffa21  # Task 2: checkout.ts, contact.ts, products.ts
  - e4733f7  # Task 3: remaining 6 files
requirements_satisfied:
  - CQ-01
---

# Plan 06-01 Summary: ActionResult Adoption

## What was done

Adopted the `ActionResult<T>` discriminated union across all 11 server action files, replacing 4 different ad-hoc error return shapes:

1. `{ error: string }` (auth actions)
2. `{ data: T; error: string | null }` (blog, reviews)
3. `{ success: boolean; error?: string }` (mutations)
4. Raw data returns (orders, products)

All 41+ exported server action functions now use `ok(data)` / `fail(errorMessage)` from `lib/action-result.ts`.

## Files modified

| File | Functions converted | Pattern |
|------|-------------------|---------|
| `actions/auth.ts` | 4 (signIn/Up/Google, signOut kept as redirect) | `ActionResult<void>`, `ActionResult<{url}>` |
| `actions/dev-auth.ts` | 1 | `ActionResult<{email}>` |
| `actions/checkout.ts` | 1 | `ActionResult<{url}>` + for-loop refactor |
| `actions/contact.ts` | 1 | `ActionResult<void>` |
| `actions/products.ts` | 4 | `ActionResult<{data,total,...}>`, `ActionResult<Product[]>` |
| `actions/admin-products.ts` | 5 | `ActionResult<string>` for create, `ActionResult<void>` for mutations |
| `actions/blog.ts` | 7 | `ActionResult<string>` for create, `ActionResult<BlogPost\|null>` |
| `actions/orders.ts` | 6 | `ActionResult<{orders,count}>`, `ActionResult<void>` |
| `actions/reviews.ts` | 6 | `ActionResult<void>` for mutations |
| `actions/coupons.ts` | 4 | `ActionResult<void>` for mutations |
| `actions/settings.ts` | 1 (updateShopSettings) | `ActionResult<void>` |

## Design decisions

- **`getShopSettings()`** kept as raw `ShopSettings` return (not wrapped in ActionResult) because it always succeeds with fallback defaults, and `checkout.ts` depends on the direct shape.
- **`signOut()`** left without ActionResult since it calls `redirect()` which throws internally.
- **Not-found patterns** use `ok(null)` rather than `fail()` since "not found" is a valid data result.
- **checkout.ts** refactored from `.map()` with `throw` to `for...of` with `return fail()` so error returns exit the enclosing function.

## Verification

- All 11 action files import from `@/lib/action-result`
- Every file has ok/fail returns (134 total across all files)
- No raw `{ success, error }` or `{ data, error }` shapes remain
- Build type errors are consumer-side only (Plan 06-02 scope)
