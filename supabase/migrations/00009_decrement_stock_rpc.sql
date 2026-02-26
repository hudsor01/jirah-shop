-- Atomic stock decrement RPC
--
-- Signature: decrement_stock(p_product_id uuid, p_variant_id uuid DEFAULT NULL, p_quantity integer DEFAULT 1)
-- Returns:  integer (number of rows updated)
--           0 = insufficient stock (no rows matched the WHERE condition)
--           1 = stock successfully decremented
--
-- Purpose:  Eliminates TOCTOU race condition (CRIT-02) by performing an atomic
--           check-and-decrement in a single UPDATE statement. Concurrent checkouts
--           cannot oversell because the WHERE clause ensures stock_quantity >= p_quantity.
--
-- Usage:    Called from the Stripe webhook handler after order items are created.
--           If variant_id is provided, decrements product_variants.stock_quantity.
--           Otherwise, decrements products.stock_quantity.

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
