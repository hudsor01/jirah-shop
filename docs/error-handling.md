# Error Handling: ActionResult\<T\>

## Overview

All server actions in jirah-shop return `ActionResult<T>` -- a discriminated union that makes error handling explicit and type-safe. There are no thrown exceptions from server actions; all errors are returned as values.

## The Type

```typescript
// lib/action-result.ts
type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
```

The generic parameter `T` represents the data type on success. Common usages:

- `ActionResult<string>` -- returns a UUID (e.g., created product ID)
- `ActionResult<void>` -- mutation with no return data
- `ActionResult<{ url: string }>` -- returns a URL (e.g., Stripe Checkout)
- `ActionResult<{ orders: Order[]; count: number }>` -- returns paginated data

## Helper Functions

```typescript
import { ok, fail } from "@/lib/action-result";

// Success
return ok(product);      // { success: true, data: product }
return ok(undefined);    // { success: true, data: undefined } (for void actions)

// Failure
return fail("Not found");  // { success: false, error: "Not found" }
```

## Server Action Pattern

A typical server action follows this structure:

```typescript
"use server";

import { z } from "zod";
import { ok, fail, type ActionResult } from "@/lib/action-result";
import { requireAdmin } from "@/lib/auth";
import { formatZodError } from "@/lib/validations";

const ThingSchema = z.object({
  name: z.string().min(1, "Name is required"),
  value: z.number().positive(),
});

export async function createThing(
  formData: FormData
): Promise<ActionResult<string>> {
  // 1. Auth check (if needed)
  await requireAdmin();

  // 2. Zod validation
  const raw = {
    name: formData.get("name") as string,
    value: Number(formData.get("value")),
  };
  const parsed = ThingSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(formatZodError(parsed.error));
  }

  // 3. Business logic
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("things")
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return fail(error.message);
  }

  // 4. Cache invalidation
  revalidatePath("/admin/things");
  updateTag("things");

  // 5. Return success
  return ok(data.id);
}
```

Key points:
- Auth checks come first (requireAdmin or getUser)
- Zod validates all input before any business logic
- Database/API errors are caught and returned as `fail()` values
- Cache invalidation happens after successful mutations
- No try/catch needed for expected errors (Zod failures, DB errors)

## Client Consumption Pattern

Client components consume ActionResult with a simple success check:

```typescript
"use client";

import { createThing } from "@/actions/things";
import { toast } from "sonner";

function CreateForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createThing(formData);

    if (result.success) {
      toast.success("Created!");
      // result.data is typed as string (the created ID)
    } else {
      toast.error(result.error);
      // result.error is typed as string
    }
  }

  return <form action={handleSubmit}>...</form>;
}
```

For actions used with `useActionState`:

```typescript
"use client";

import { useActionState } from "react";
import { signUpWithEmail } from "@/actions/auth";

function SignUpForm() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  return (
    <form action={formAction}>
      {/* form fields */}
      {state && !state.success && (
        <p className="text-destructive">{state.error}</p>
      )}
      <button type="submit" disabled={isPending}>
        Sign Up
      </button>
    </form>
  );
}
```

## Key Principles

- **No thrown exceptions**: All errors are returned as values via `fail()`
- **Discriminated union**: TypeScript narrows the type based on the `success` boolean
- **Generic data type**: `ActionResult<Product>`, `ActionResult<void>`, `ActionResult<Order[]>`
- **Consistent error strings**: Human-readable messages safe to display in toasts
- **No sensitive data in errors**: Error messages never contain stock counts, coupon codes, or internal state
- **Zod-first validation**: All server action inputs are validated with Zod `safeParse()` before any business logic

## Migration History

The project migrated from ad-hoc error handling (mix of thrown exceptions, null returns, and custom objects) to the unified ActionResult pattern in Phase 6. All 38 server actions now use this contract consistently.

See `lib/action-result.ts` for the type definition and helper implementations.
