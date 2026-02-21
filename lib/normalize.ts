import { toNum } from "@/lib/utils";
import type {
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Coupon,
} from "@/types/database";

/**
 * Supabase JS returns Postgres `numeric` columns as strings.
 * These normalizers convert them to proper JS numbers at the server-action
 * boundary so all downstream code (toFixed, arithmetic, comparisons) works.
 */

// ─── Product ────────────────────────────────────────────

export function normalizeProduct(raw: Record<string, unknown>): Product {
  return {
    ...(raw as Product),
    price: toNum(raw.price),
    compare_at_price:
      raw.compare_at_price != null ? toNum(raw.compare_at_price) : null,
    stock_quantity: toNum(raw.stock_quantity),
  };
}

// ─── Product Variant ────────────────────────────────────

export function normalizeVariant(raw: Record<string, unknown>): ProductVariant {
  return {
    ...(raw as ProductVariant),
    price: toNum(raw.price),
    compare_at_price:
      raw.compare_at_price != null ? toNum(raw.compare_at_price) : null,
    stock_quantity: toNum(raw.stock_quantity),
    sort_order: toNum(raw.sort_order),
  };
}

// ─── Order ──────────────────────────────────────────────

export function normalizeOrder(raw: Record<string, unknown>): Order {
  return {
    ...(raw as Order),
    subtotal: toNum(raw.subtotal),
    shipping_cost: toNum(raw.shipping_cost),
    discount_amount: toNum(raw.discount_amount),
    total: toNum(raw.total),
  };
}

// ─── Order Item ─────────────────────────────────────────

export function normalizeOrderItem(raw: Record<string, unknown>): OrderItem {
  return {
    ...(raw as OrderItem),
    quantity: toNum(raw.quantity),
    unit_price: toNum(raw.unit_price),
    total_price: toNum(raw.total_price),
  };
}

// ─── Coupon ─────────────────────────────────────────────

export function normalizeCoupon(raw: Record<string, unknown>): Coupon {
  return {
    ...(raw as Coupon),
    discount_value: toNum(raw.discount_value),
    min_order_amount:
      raw.min_order_amount != null ? toNum(raw.min_order_amount) : null,
    max_uses: raw.max_uses != null ? toNum(raw.max_uses) : null,
    current_uses: toNum(raw.current_uses),
  };
}
