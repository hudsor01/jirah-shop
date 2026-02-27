## Plan 04-02 Summary: N+1 Customer Order Counts Verification

**Status**: COMPLETE
**Commit**: 3a79a43

### What was done
1. Verified `app/admin/customers/page.tsx` order counts query:
   - Already uses a single `.from("orders").select("user_id").in("user_id", customerIds)` query
   - JS reduce groups into per-customer counts — NOT N+1
   - Only the `user_id` column is selected (lightweight)

2. Added clarifying comment documenting the pattern is intentionally a single grouped query

### Verification
- [x] Customers page has exactly ONE query to the orders table
- [x] Query selects only `user_id` column
- [x] `order_count` still displays correctly
- [x] TypeScript compiles without errors
