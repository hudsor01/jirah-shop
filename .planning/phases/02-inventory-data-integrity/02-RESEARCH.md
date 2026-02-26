# Phase 2: Inventory & Data Integrity - Research

**Researched:** 2026-02-26
**Domain:** Postgres RPC for atomic operations, Stripe/Supabase rollback patterns
**Confidence:** HIGH

## Summary

Phase 2 fixes two distinct problems: (1) the TOCTOU race condition where stock is checked at checkout creation but never decremented atomically, and (2) `createProduct` leaving orphaned Stripe/Supabase records on partial failure.

The codebase already has a working RPC pattern (`increment_coupon_uses` in migration 00004) using `SECURITY DEFINER` with `plpgsql`. The new `decrement_stock` RPC follows the exact same convention. The webhook handler (`app/api/webhooks/stripe/route.ts`) currently creates orders and order items but performs zero stock decrement -- this is where the RPC call must be added.

**Primary recommendation:** Create a Postgres RPC `decrement_stock` via SQL migration, call it from the webhook handler for each order line item, and wrap `createProduct` in try/catch with reverse-order cleanup.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Create a Postgres RPC `decrement_stock(p_product_id UUID, p_variant_id UUID, p_quantity INT)` that does `UPDATE ... SET stock_quantity = stock_quantity - p_quantity WHERE stock_quantity >= p_quantity`
- RPC returns the number of rows updated -- 0 rows means insufficient stock (atomic check-and-decrement in single query)
- Webhook handler calls this RPC instead of separate read-then-write pattern
- If RPC returns 0 rows: log a CRITICAL alert via Sentry (`captureMessage` with level `error`) including order ID, product ID, requested quantity -- order exists but stock was insufficient
- The RPC must be created via Supabase SQL migration (managed outside this codebase) -- create the migration SQL file at `supabase/migrations/` for reference, and document the RPC signature
- Replace current stock decrement logic in the Stripe webhook handler with a single RPC call per line item
- Process all line items in the order -- if any single item fails stock decrement, log alert but continue processing remaining items (partial fulfillment logging, not rollback of the whole order)
- Idempotency is already handled via session ID uniqueness constraint -- preserve this
- `createProduct` action currently creates: Supabase product row -> Stripe product -> Stripe prices -> Supabase variants
- If variant insertion fails: delete the Stripe product, delete the Supabase product row (cleanup orphans)
- If Stripe product creation fails: delete the Supabase product row
- If Stripe price creation fails for any variant: delete the Stripe product and Supabase product row
- Use try/catch with explicit cleanup in reverse order of creation
- Log all cleanup actions via Sentry for audit trail

### Claude's Discretion
- Exact Postgres RPC implementation details (SECURITY DEFINER vs INVOKER, schema placement)
- Whether to wrap webhook stock processing in a database transaction or process line items independently
- Error message format for the Sentry critical alerts
- Whether rollback cleanup is sequential or parallel

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INV-01 | Webhook decrements stock via atomic Postgres RPC with `WHERE stock_quantity >= p_quantity` | RPC pattern validated against existing `increment_coupon_uses` (migration 00004); Supabase `.rpc()` call pattern confirmed in webhook handler |
| INV-02 | Stock decrement prevents negative values; zero-row return triggers critical alert | RPC returns row count; `logger.error()` already sends to Sentry via `captureMessage` with level `error` |
| INV-03 | TOCTOU race condition eliminated by atomic DB-level stock check | Single UPDATE with WHERE clause is atomic in Postgres -- confirmed by Postgres documentation |
| INV-04 | `createProduct` rolls back on partial failure -- cleans up orphaned Supabase/Stripe records | Current code creates Stripe product -> Stripe price -> DB product -> variants; cleanup must reverse this order |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | Existing | RPC calls via `.rpc()` method | Already used throughout codebase |
| stripe | Existing | Product/price management | Already used for Stripe operations |
| @sentry/nextjs | Existing | Error alerting via `logger.error()` | Already integrated in `lib/logger.ts` |

### Supporting
No new libraries needed. This phase uses only existing dependencies.

### Alternatives Considered
None -- all decisions are locked by CONTEXT.md. No new libraries required.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Recommended Project Structure
```
supabase/migrations/
├── 00009_decrement_stock_rpc.sql   # New atomic stock RPC
app/api/webhooks/stripe/
├── route.ts                         # Modified: add stock decrement after order items insert
actions/
├── admin-products.ts                # Modified: add rollback cleanup to createProduct
```

### Pattern 1: Atomic RPC with Row Count Return
**What:** Postgres function returns integer count of updated rows. Zero means precondition failed.
**When to use:** Any atomic check-and-modify operation.
**Example:**
```sql
-- Follows existing increment_coupon_uses pattern (migration 00004)
create or replace function public.decrement_stock(
  p_product_id uuid,
  p_variant_id uuid default null,
  p_quantity integer default 1
)
returns integer
language plpgsql
security definer
as $$
declare
  rows_updated integer;
begin
  if p_variant_id is not null then
    update public.product_variants
    set stock_quantity = stock_quantity - p_quantity,
        updated_at = now()
    where id = p_variant_id
      and product_id = p_product_id
      and stock_quantity >= p_quantity;
  else
    update public.products
    set stock_quantity = stock_quantity - p_quantity,
        updated_at = now()
    where id = p_product_id
      and stock_quantity >= p_quantity;
  end if;

  get diagnostics rows_updated = row_count;
  return rows_updated;
end;
$$;
```

### Pattern 2: Supabase RPC Call in TypeScript
**What:** Calling the RPC from the webhook handler using the admin client.
**When to use:** Server-side stock decrement after order creation.
**Example:**
```typescript
// Source: Existing pattern from webhook handler (increment_coupon_uses)
const { data: rowsUpdated, error } = await supabase.rpc("decrement_stock", {
  p_product_id: productId,
  p_variant_id: variantId || null,
  p_quantity: quantity,
});

if (error || rowsUpdated === 0) {
  logger.error("Stock decrement failed — insufficient stock after checkout", {
    orderId: order.id,
    productId,
    variantId: variantId || undefined,
    requestedQuantity: quantity,
  });
}
```

### Pattern 3: Reverse-Order Cleanup for createProduct
**What:** On failure, clean up resources in reverse order of creation.
**When to use:** Multi-service operations that can fail partway.
**Example:**
```typescript
let stripeProductId: string | null = null;
let dbProductId: string | null = null;

try {
  // Step 1: Create Stripe product
  const stripeProduct = await stripe.products.create({ ... });
  stripeProductId = stripeProduct.id;

  // Step 2: Create Stripe price
  const stripePrice = await stripe.prices.create({ ... });

  // Step 3: Insert DB product
  const { data: product, error } = await supabase.from("products").insert({ ... }).select().single();
  if (error) throw new Error(error.message);
  dbProductId = product.id;

  // Step 4: Insert variants with Stripe prices
  // ... variant creation ...

  return { success: true, id: product.id };
} catch (err) {
  // Cleanup in reverse order
  if (dbProductId) {
    await supabase.from("products").delete().eq("id", dbProductId);
    logger.error("Rolled back Supabase product", { dbProductId });
  }
  if (stripeProductId) {
    await stripe.products.update(stripeProductId, { active: false });
    logger.error("Archived orphaned Stripe product", { stripeProductId });
  }
  throw err;
}
```

### Anti-Patterns to Avoid
- **Read-then-write stock operations:** Classic TOCTOU. Always use atomic UPDATE with WHERE condition.
- **Ignoring RPC errors silently:** A failed stock decrement means the order exists but inventory is wrong. Must log critically.
- **Rolling back the entire order on stock failure:** The order already exists in Stripe (payment collected). Log the discrepancy, don't fail the webhook.
- **Using Stripe `products.del()` for cleanup:** Stripe products may have associated objects. Use `update({ active: false })` to archive instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic stock decrement | Application-level locking or SELECT FOR UPDATE | Postgres RPC with WHERE clause | Single atomic UPDATE is simpler, faster, and race-free |
| Idempotency check | Custom deduplication logic | Existing `stripe_checkout_session_id` uniqueness | Already handled -- preserve it |
| Error alerting | Custom alerting service | `logger.error()` -> Sentry | Already integrated |

**Key insight:** Postgres single-statement UPDATE with a WHERE clause is inherently atomic. No need for explicit transactions, locks, or application-level coordination.

## Common Pitfalls

### Pitfall 1: RPC Return Type Mismatch
**What goes wrong:** Supabase `.rpc()` returns `data` as the function's return value. If the function returns `integer`, `data` is a number, not an object.
**Why it happens:** Expecting `data.rows_updated` instead of just `data`.
**How to avoid:** Function returns `integer`; TypeScript reads `data` directly as `number`.
**Warning signs:** `data` is `null` or `undefined` unexpectedly.

### Pitfall 2: Variant vs Product Stock
**What goes wrong:** Decrementing product stock when the item has a variant, or vice versa.
**Why it happens:** Products with variants track stock per-variant, not at the product level.
**How to avoid:** The RPC checks `p_variant_id IS NOT NULL` to decide which table to update.
**Warning signs:** Product stock goes negative while variant stock stays the same.

### Pitfall 3: Stripe Product Archival vs Deletion
**What goes wrong:** Calling `stripe.products.del()` fails because the product has associated prices.
**Why it happens:** Stripe doesn't allow deleting products with prices.
**How to avoid:** Use `stripe.products.update(id, { active: false })` to archive instead.
**Warning signs:** Stripe API error "This product cannot be deleted because it has one or more user-created Prices."

### Pitfall 4: createProduct Order of Operations
**What goes wrong:** Current code creates Stripe product, then Stripe price, then DB row, then variants. But the CONTEXT.md says the order is "Supabase product row -> Stripe product -> Stripe prices -> Supabase variants."
**Why it happens:** The CONTEXT.md description doesn't match the actual code. The actual code creates Stripe first.
**How to avoid:** Follow the ACTUAL code order (Stripe product -> Stripe price -> DB product -> variants) for cleanup. Clean up in reverse order: DB product -> Stripe product.
**Warning signs:** Cleanup misses resources created before the failed step.

### Pitfall 5: Admin Client RLS Bypass
**What goes wrong:** Using the regular server client for stock decrement in webhook -- RLS blocks the UPDATE.
**Why it happens:** The webhook handler already uses `createAdminClient()` which bypasses RLS, but the RPC uses `SECURITY DEFINER` which runs as the function owner.
**How to avoid:** Use `SECURITY DEFINER` on the RPC (matches `increment_coupon_uses` pattern). The admin client calls the RPC; the function runs with owner privileges.
**Warning signs:** "permission denied" errors from RPC calls.

## Code Examples

### Webhook Stock Decrement Integration Point
```typescript
// After order items are inserted (around line 215 in route.ts)
// Process stock decrement for each line item
for (const item of orderItems) {
  const { data: rowsUpdated, error: stockError } = await supabase.rpc(
    "decrement_stock",
    {
      p_product_id: item.product_id,
      p_variant_id: item.variant_id,
      p_quantity: item.quantity,
    }
  );

  if (stockError || rowsUpdated === 0) {
    logger.error("Stock decrement failed — insufficient stock post-checkout", {
      orderId: order.id,
      productId: item.product_id,
      variantId: item.variant_id || undefined,
      requestedQuantity: item.quantity,
      rpcError: stockError?.message,
    });
    // Continue processing remaining items (partial fulfillment logging)
  }
}
```

### createProduct Cleanup Pattern
```typescript
// Track created resources for cleanup
let stripeProductId: string | null = null;
let dbProductId: string | null = null;

try {
  // ... creation steps ...
} catch (err) {
  // Reverse-order cleanup
  if (dbProductId) {
    const { error: delError } = await supabase.from("products").delete().eq("id", dbProductId);
    logger.error("createProduct rollback: deleted Supabase product", {
      dbProductId,
      deleteSuccess: !delError,
    });
  }
  if (stripeProductId) {
    try {
      await stripe.products.update(stripeProductId, { active: false });
      logger.error("createProduct rollback: archived Stripe product", { stripeProductId });
    } catch (stripeErr) {
      logger.error("createProduct rollback: failed to archive Stripe product", {
        stripeProductId,
        error: stripeErr instanceof Error ? stripeErr.message : "Unknown",
      });
    }
  }
  return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SELECT then UPDATE (TOCTOU) | Atomic UPDATE with WHERE | Always been best practice | Eliminates race conditions entirely |
| No cleanup on failure | Reverse-order cleanup | Standard pattern | Prevents orphaned records |

**Deprecated/outdated:**
- Nothing relevant deprecated. The patterns are long-established Postgres fundamentals.

## Open Questions

1. **RPC function ownership and schema placement**
   - What we know: `increment_coupon_uses` uses `SECURITY DEFINER` and lives in `public` schema
   - What's unclear: Whether this runs as the `postgres` user or a specific role
   - Recommendation: Follow exact same pattern as migration 00004 -- `SECURITY DEFINER` in `public` schema. This is proven to work.

2. **createProduct actual creation order vs CONTEXT.md description**
   - What we know: CONTEXT.md says "Supabase product row -> Stripe product -> Stripe prices -> Supabase variants" but actual code does "Stripe product -> Stripe price -> DB product -> variants"
   - What's unclear: Whether the CONTEXT.md description was intentionally different
   - Recommendation: Follow the ACTUAL code order. Cleanup reverses the actual order, not the CONTEXT.md description. The rollback logic handles whichever step fails.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `app/api/webhooks/stripe/route.ts` -- current webhook handler with zero stock decrement
- Codebase analysis: `actions/admin-products.ts` -- current createProduct with no rollback
- Codebase analysis: `supabase/migrations/00004_increment_coupon_rpc.sql` -- existing RPC pattern
- Codebase analysis: `lib/logger.ts` -- Sentry integration via captureMessage
- Codebase analysis: `lib/supabase/admin.ts` -- admin client pattern
- Codebase analysis: `supabase/migrations/00001_initial_schema.sql` -- products/variants schema

### Secondary (MEDIUM confidence)
- Postgres documentation: Single-row UPDATE with WHERE clause is atomic (well-established)

### Tertiary (LOW confidence)
None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries, all existing patterns
- Architecture: HIGH - follows existing RPC and admin client conventions
- Pitfalls: HIGH - identified from actual code analysis

**Research date:** 2026-02-26
**Valid until:** 2026-03-28 (stable Postgres patterns, unlikely to change)
