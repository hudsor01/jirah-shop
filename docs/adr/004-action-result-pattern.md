# ADR-004: ActionResult Pattern for Error Handling

## Status

Accepted

## Context

Prior to standardization, the project's 38 server actions used inconsistent error handling:
- Some threw exceptions
- Some returned null on failure
- Some returned ad-hoc objects like `{ error: string }` or `{ success: boolean }`
- Client components had no consistent way to handle errors

This made it difficult to know how any given action communicated failure, leading to uncaught errors and inconsistent user-facing error messages.

## Decision

Adopt `ActionResult<T>` -- a discriminated union type with `ok()` and `fail()` helper functions:

```typescript
// lib/action-result.ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

function ok<T>(data: T): ActionResult<T>;
function fail<T = never>(error: string): ActionResult<T>;
```

All 38 server actions were migrated to return `ActionResult<T>`. The contract is:
- Validate input with Zod `safeParse()` first
- Return `fail(message)` for any error condition
- Return `ok(data)` for success
- Never throw exceptions from server actions
- Error messages are human-readable and safe to display in toasts (no sensitive data)

## Consequences

**Benefits:**
- Consistent contract across all 38 server actions
- TypeScript narrows the type based on `success` boolean -- full type safety
- Client components can use a single pattern: `if (result.success) { ... } else { toast.error(result.error) }`
- No uncaught exceptions from server actions
- Error messages are guaranteed to be human-readable strings

**Trade-offs:**
- Every caller must check `result.success` -- cannot use the data directly
- Error information is limited to a single string (no error codes or structured metadata)
- Requires discipline to never throw from server actions
- Migration effort to convert all 38 existing actions

See [docs/error-handling.md](../error-handling.md) for full documentation including usage examples and client consumption patterns.
