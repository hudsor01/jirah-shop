# Coding Conventions

**Analysis Date:** 2026-02-26

## Naming Patterns

**Files:**
- Components: kebab-case, e.g., `product-form.tsx`, `image-upload.tsx`, `product-card.tsx`
- Utilities/Hooks: kebab-case with prefix, e.g., `use-supabase-upload.ts`, `use-mobile.ts`
- Server actions: kebab-case, e.g., `admin-products.ts`, `auth.ts`, `blog.ts`
- Library modules: kebab-case, e.g., `action-result.ts`, `format.ts`, `normalize.ts`
- Type definitions: kebab-case with .ts extension, e.g., `database.ts`
- Directories: kebab-case, e.g., `product-images`, `components/admin/`, `lib/supabase/`

**Functions:**
- Camel case for regular functions: `formatPrice()`, `formatDate()`, `createProduct()`, `requireAdmin()`
- Custom hook functions: camelCase with `use` prefix: `useSupabaseUpload()`, `useMemo()`, `useCallback()`
- React components: PascalCase: `ProductForm`, `ImageUpload`, `Dropzone`, `DropzoneContent`
- Private/internal functions: same as regular functions, camelCase
- Server actions: camelCase exported from actions files: `getAdminProducts()`, `createProduct()`, `updateProduct()`

**Variables:**
- Camel case for all variables: `fileName`, `isSuccess`, `filesWithErrors`, `exceedMaxFiles`, `handleRemoveFile`
- React state variables: camelCase: `isPending`, `isActive`, `isDragActive`, `isDragReject`, `shortDescription`
- Constants: UPPER_SNAKE_CASE: `CURRENCY`, `CATEGORIES`, `BUCKET`
- Type variables: PascalCase: `T` for generics, `FileWithPreview`, `UseSupabaseUploadOptions`
- Module-level constants: camelCase or UPPER_SNAKE_CASE depending on context

**Types:**
- Exported interfaces/types: PascalCase: `ProductFormData`, `VariantFormData`, `FileWithPreview`, `UseSupabaseUploadOptions`, `UseSupabaseUploadReturn`
- Union types: PascalCase: `ActionResult<T>`, `LogLevel`, `LogContext`
- Component props: PascalCase ending in `Props`: `ProductFormProps`, `DropzoneProps`, `ImageUploadProps`

## Code Style

**Formatting:**
- No explicit prettier config file detected
- Uses Next.js default formatting and ESLint with core-web-vitals + TypeScript configs
- Indentation: 2 spaces (observed in package.json scripts and source files)
- Line length: No hard limit detected; files exceed 100 characters regularly
- Semicolons: Always present (explicit JS style)

**Linting:**
- Tool: ESLint 9+ with flat config (eslint.config.mjs)
- Configuration: `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Special rules overrides:
  - `app/global-error.tsx`: disables `@next/next/no-html-link-for-pages` (intentional plain `<a>` tag)
  - `components/data-table.tsx`: disables `react-hooks/incompatible-library` (TanStack Table limitation)

## Import Organization

**Order:**
1. React and core framework imports: `import { useState, useTransition } from 'react'`
2. Next.js imports: `import { useRouter } from 'next/navigation'`
3. External library imports: `import { toast } from 'sonner'`, `import { createClient } from '@supabase/supabase-js'`
4. Internal component imports: `import { Button } from '@/components/ui/button'`
5. Internal utility/action imports: `import { createProduct, type ProductFormData } from '@/actions/admin-products'`
6. Type-only imports with `type` keyword: `import type { Product, ProductVariant } from '@/types/database'`

**Path Aliases:**
- All internal imports use `@/` alias mapped to project root in `tsconfig.json`
- Never use relative paths like `../../../` — always use `@/`
- Structure: `@/[directory]/[file]`, e.g., `@/lib/utils`, `@/components/ui/button`, `@/hooks/use-supabase-upload`

## Error Handling

**Patterns:**
- Async/await with try-catch in server actions and utilities
- Direct throws for validation failures: `throw new Error("Unauthorized: not authenticated")` in `requireAdmin()`
- Module-level validation with immediate throws: `env.ts` validates all required environment variables at import time
- Server actions return `ActionResult<T>` discriminated union: `{ success: true; data: T } | { success: false; error: string }`
  - Use helper functions: `ok(data)` and `fail(error)` from `@/lib/action-result.ts`
  - Consumers check with `if (result.success) { result.data ... } else { result.error ... }`
- Error logging with `logger.error()`, `logger.warn()`, `logger.info()`, `logger.exception()` from `@/lib/logger.ts`
- Sentry integration for error tracking in logger module

## Logging

**Framework:** Custom logger wrapper around Sentry, console output

**Patterns:**
- Info logs: `logger.info(message, context?)`
- Warning logs: `logger.warn(message, context?)`
- Error logs: `logger.error(message, context?)`
- Exception logs (with stack trace): `logger.exception(err, context?)`
- Log output: JSON-stringified entries with timestamp, level, message, and context
- Sentry capture: Automatic capture for error and exception levels with context as extras
- Usage: `logger.error('Error fetching admin products', { error: error.message })`

## Comments

**When to Comment:**
- JSDoc comments on exported functions, types, and constants explaining purpose and usage
- Inline comments for complex logic, especially in hooks and calculations
- Section headers with dashes for visual organization: `// ─── Product ────────────────────────────────────────────`
- Multi-line comment blocks for explaining unconventional patterns or decisions
- Comments explaining "why" not "what" — code should be self-documenting on behavior

**JSDoc/TSDoc:**
- Used extensively on hook options: `/** Name of bucket to upload files to in your Supabase project */`
- Type parameters documented: `/** The number of seconds the asset is cached... **/`
- Return types sometimes documented: `/** Current timestamp as an ISO-8601 string, for use in DB updated_at fields. */`
- Component props and functions have JSDoc blocks

## Function Design

**Size:** Medium to large — no strict limit, but extracted common patterns into utilities
- `ProductForm` component is 441 lines (mentioned in memory as acceptable with extracted helpers)
- Hooks can be 100+ lines with multiple responsibilities

**Parameters:**
- Destructured object parameters for multiple options: `useSupabaseUpload(options: UseSupabaseUploadOptions)`
- Single callback props may be named explicitly: `onUpload`, `onChange`, `onDrop`
- Component props always destructured in function signature

**Return Values:**
- Hooks return objects with multiple properties: `{ files, setFiles, successes, isSuccess, loading, errors, ... }`
- Server actions return `ActionResult<T>` for consistent error handling
- Utility functions return primitives or types directly, not wrapped
- Components return JSX.Element

## Module Design

**Exports:**
- Named exports preferred for utilities and functions
- Default export used for components: `export function ProductForm(...) {}` (named, not default)
- Type exports with `export type` keyword: `export type ActionResult<T> = ...`
- Barrel exports in `components/ui/` for shadcn components

**Barrel Files:**
- Used minimally — most imports are direct to specific files
- `components/ui/` has many small component files imported directly
- No root-level barrel files observed

## Blank Line and Spacing

**Patterns:**
- Single blank line between functions and logical sections
- Multiple blank lines (dashes as visual separators) for major sections in longer files
- No blank lines at end of files
- Conditional exports grouped together

---

*Convention analysis: 2026-02-26*
