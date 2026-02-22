create or replace function public.has_purchased_product(
  p_user_id uuid,
  p_product_id uuid
) returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1
    from public.orders o
    join public.order_items oi on oi.order_id = o.id
    where o.user_id = p_user_id
      and oi.product_id = p_product_id
      and o.status in ('paid', 'shipped', 'delivered')
  );
$$;
