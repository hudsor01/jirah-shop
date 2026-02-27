# Phase 6: Error Handling & Data Access - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

All server actions use a consistent error contract (`ActionResult<T>`) and data access is separated from business logic into a queries layer. Deduplication of shared logic. Minor code quality fixes. This does NOT add tests (Phase 7) or documentation (Phase 8).

</domain>

<decisions>
## Implementation Decisions

### ActionResult Adoption
- `ActionResult<T>` is already defined in `lib/action-result.ts` as `{ success: true, data: T } | { success: false, error: string }`
- All 38 server actions across 11 files must return `ActionResult<T>` instead of raw throws, ad-hoc `{ error }`, or inconsistent shapes
- Actions that currently throw errors: wrap in try/catch, return `{ success: false, error: "message" }`
- Actions that return `{ error: string }`: convert to `{ success: false, error }`
- Actions that return raw data: wrap in `{ success: true, data }`
- Void actions (mutations with no return value): use `ActionResult<void>` returning `{ success: true, data: undefined }`

### Client Consumer Updates
- Every client component that calls a server action must handle `ActionResult<T>` by checking `result.success`
- Replace patterns like `if (result?.error)` with `if (!result.success)`
- Toast messages: `result.success ? toast.success(...) : toast.error(result.error)`
- Forms using `useActionState`: state type becomes `ActionResult<T> | null`

### Queries Layer Extraction
- Create `queries/` directory at project root (sibling to `actions/`)
- Extract all Supabase read queries from actions into query functions: `queries/products.ts`, `queries/orders.ts`, `queries/blog.ts`, etc.
- Query functions are pure data access -- no auth checks, no business logic, no error handling beyond Supabase errors
- Server actions call query functions for reads, keep writes inline (writes have business logic)
- Cached query wrappers (from Phase 5) move to use these base query functions

### Deduplication & Code Quality
- Shared checkout hook: extract duplicated checkout flow logic between cart drawer and cart page into a shared hook
- Deduplicate review actions: consolidate any duplicated review CRUD patterns
- Fix double toast issue (toasting in both action and component)
- Product form refactoring: break large product form into subcomponents if >400 lines
- Imports ordering: consistent pattern (React, Next, external, internal, types)
- Coupon form state reset after successful creation
- Replace any direct array mutation (`.push()`, `.splice()` on state) with immutable patterns
- `SITE_URL` uses validated env module instead of raw `process.env`

### Claude's Discretion
- Exact file organization within `queries/` directory
- Which query functions to extract first vs later
- How to break up the product form (by section vs by field type)
- Import ordering tool (manual convention vs eslint rule)

</decisions>

<specifics>
## Specific Ideas

- `ActionResult<T>` is defined but unused across all 38 server actions -- this is the biggest consistency fix
- 4+ different error return shapes currently exist across action files
- Some components toast on error AND the action toasts -- double notification
- Cart drawer and cart page duplicate the checkout initiation flow
- Product form is 441+ lines -- candidate for subcomponent extraction

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 06-error-handling-data-access*
*Context gathered: 2026-02-26*
