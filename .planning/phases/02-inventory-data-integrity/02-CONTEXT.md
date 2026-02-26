# Phase 2: Inventory & Data Integrity - Context

**Gathered:** 2026-02-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Stock management is atomic and race-condition-free; product creation handles partial failures gracefully. This phase fixes the TOCTOU race condition in stock decrement and adds rollback for partial product creation. No new inventory features (low stock alerts, reorder points) -- those would be separate phases.

</domain>

<decisions>
## Implementation Decisions

### Atomic Stock Decrement
- Create a Postgres RPC `decrement_stock(p_product_id UUID, p_variant_id UUID, p_quantity INT)` that does `UPDATE ... SET stock_quantity = stock_quantity - p_quantity WHERE stock_quantity >= p_quantity`
- RPC returns the number of rows updated -- 0 rows means insufficient stock (atomic check-and-decrement in single query)
- Webhook handler calls this RPC instead of separate read-then-write pattern
- If RPC returns 0 rows: log a CRITICAL alert via Sentry (`captureMessage` with level `error`) including order ID, product ID, requested quantity -- order exists but stock was insufficient
- The RPC must be created via Supabase SQL migration (managed outside this codebase) -- create the migration SQL file at `supabase/migrations/` for reference, and document the RPC signature

### Webhook Integration
- Replace current stock decrement logic in the Stripe webhook handler with a single RPC call per line item
- Process all line items in the order -- if any single item fails stock decrement, log alert but continue processing remaining items (partial fulfillment logging, not rollback of the whole order)
- Idempotency is already handled via session ID uniqueness constraint -- preserve this

### Product Creation Rollback
- `createProduct` action currently creates: Supabase product row → Stripe product → Stripe prices → Supabase variants
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

</decisions>

<specifics>
## Specific Ideas

- The TOCTOU race condition is documented in the code review as CRIT-02: stock is checked at checkout session creation time but not decremented until webhook fires -- concurrent checkouts can oversell
- Current stock decrement in webhook does a read then a separate write -- replace with atomic RPC
- `createProduct` in `actions/admin-products.ts` has no cleanup on partial failure -- orphaned records accumulate in Supabase and Stripe

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-inventory-data-integrity*
*Context gathered: 2026-02-26*
