-- Index on order_items.product_id for has_purchased_product() performance

create index idx_order_items_product_id on public.order_items (product_id);
