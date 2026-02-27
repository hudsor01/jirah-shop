---
phase: 06-error-handling-data-access
plan: 04
status: complete
commits:
  - 4fb0516
files_modified:
  - hooks/use-checkout.ts (created)
  - components/storefront/cart-drawer.tsx
  - app/(storefront)/cart/page.tsx
  - components/storefront/product-card.tsx
  - components/admin/product-form.tsx
  - components/admin/product-form/types.ts (created)
  - components/admin/product-form/basic-info-fields.tsx (created)
  - components/admin/product-form/pricing-fields.tsx (created)
  - components/admin/product-form/category-brand-fields.tsx (created)
  - components/admin/product-form/details-fields.tsx (created)
  - components/admin/product-form/status-fields.tsx (created)
  - components/admin/coupon-form.tsx
  - hooks/use-supabase-upload.ts
  - components/dropzone.tsx
  - tests/storage.test.ts
  - actions/reviews.ts
  - actions/auth.ts
  - lib/constants.ts
  - queries/products.ts
---

## What Changed

### Task 1: Extract useCheckout Hook + Fix Double Toast

- **Created** `hooks/use-checkout.ts`: shared checkout flow (validate prices, create session, redirect) used by both cart-drawer and cart page
- **Updated** `components/storefront/cart-drawer.tsx`: replaced ~35 lines of inline checkout logic with `useCheckout()` hook
- **Updated** `app/(storefront)/cart/page.tsx`: same dedup — replaced inline checkout with `useCheckout()`
- **Fixed** `components/storefront/product-card.tsx`: removed duplicate `toast.success()` call — cart-provider already fires toast in `addItem()`

### Task 2: Product Form Refactoring + Review Dedup + Tag Search

- **Refactored** `components/admin/product-form.tsx` into typed subcomponents:
  - `product-form/types.ts` — `ProductFormFields` and `ProductFormHandlers` types
  - `product-form/basic-info-fields.tsx` — name, slug, descriptions
  - `product-form/pricing-fields.tsx` — price, compare-at price, stock
  - `product-form/category-brand-fields.tsx` — category, subcategory, brand, own brand
  - `product-form/details-fields.tsx` — ingredients, how to use, tags
  - `product-form/status-fields.tsx` — active/featured toggles
- State kept in parent; rendering delegated via `Pick<>` typed props
- **Deduplicated** `actions/reviews.ts`: `rejectReview` is now an alias for `deleteReview` (were identical)
- **Fixed** `queries/products.ts`: tag search changed from `tags.cs.{${s}}` to `tags::text.ilike.%${s}%` for partial matching

### Task 3: Minor Code Quality Fixes

- **Coupon form reset**: added `useEffect` watching `coupon` prop to reset/populate form fields on mode switch
- **FileWithPreview type fix**: replaced `File` object mutation pattern with proper wrapper type `{ file: File; preview: string; errors: readonly FileError[] }`; updated `components/dropzone.tsx` and `tests/storage.test.ts` to use new shape
- **Upload hook deps**: added missing `supabase.storage`, `cacheControl`, `upsert` to `onUpload` callback deps
- **SITE_URL assertion**: replaced `process.env.NEXT_PUBLIC_SITE_URL!` with build-time throw if missing
- **Dead code removal**: removed unused `signInWithGoogle` server action from `actions/auth.ts` (buttons use browser client); cleaned up unused `ok`, `SITE_URL` imports

## Verification

- `bunx tsc --noEmit` — passes (zero errors)
- `bun run vitest run` — 6/6 tests pass
- `bun run build` — pre-existing failure on `/checkout/failure` and `/admin/blog` (cookies in "use cache"), NOT related to these changes
- `useCheckout` used in cart-drawer and cart page
- No raw `process.env.NEXT_PUBLIC_SITE_URL!` in constants
- No `tags.cs` array containment in queries
- No `signInWithGoogle` references in codebase

## Notes

- Product form main file is 260 lines (down from 440). The remaining bulk is 20 `useState` calls and `handleSubmit`. A `useReducer` conversion would trim further but is a larger refactor.
- The `eslint-disable` on unmount cleanup in `use-supabase-upload.ts` line 112 is intentional (empty deps = unmount-only), not a bug.
- Import ordering pass skipped (low-value, high-churn across 11 files).
