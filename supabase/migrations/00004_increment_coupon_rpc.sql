-- Atomic coupon usage increment to prevent race conditions
create or replace function public.increment_coupon_uses(coupon_code text)
returns void
language plpgsql
security definer
as $$
begin
  update public.coupons
  set current_uses = current_uses + 1
  where code = coupon_code
    and is_active = true;
end;
$$;
