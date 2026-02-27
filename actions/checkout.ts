"use server";

import { z } from "zod";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getShopSettings } from "@/actions/settings";
import { toNum } from "@/lib/utils";
import type { CartItem } from "@/types/database";
import { CURRENCY, SITE_URL } from "@/lib/constants";
import { logger } from "@/lib/logger";
import { formatZodError } from "@/lib/validations";

const CartItemSchema = z.object({
  product_id: z.string().min(1, "Product ID is required"),
  variant_id: z.string().nullable().optional(),
  name: z.string().min(1),
  variant_name: z.string().nullable().optional(),
  price: z.number().positive("Price must be positive"),
  quantity: z.number().int().positive("Quantity must be at least 1"),
  image: z.string().nullable().optional(),
});

const CreateCheckoutSchema = z.object({
  items: z.array(CartItemSchema).min(1, "Cart is empty"),
  couponCode: z.string().nullable().optional(),
});

export async function createCheckoutSession(
  items: CartItem[],
  couponCode?: string | null
) {
  const parsed = CreateCheckoutSchema.safeParse({ items, couponCode });
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error));
  }
  const validatedInput = parsed.data;

  // ── Server-side price validation ──────────────────────────
  // Never trust client-supplied prices. Look up authoritative prices from DB.
  const supabase = await createClient();

  const productIds = [...new Set(validatedInput.items.map((i) => i.product_id))];
  const variantIds = validatedInput.items
    .map((i) => i.variant_id)
    .filter((id): id is string => !!id);

  // Run independent DB queries in parallel
  const [productsResult, variantsResult, settings] = await Promise.all([
    supabase
      .from("products")
      .select("id, price, stock_quantity, is_active, name")
      .in("id", productIds),
    variantIds.length
      ? supabase
          .from("product_variants")
          .select("id, price, stock_quantity, is_active, product_id")
          .in("id", variantIds)
      : Promise.resolve({ data: [] as { id: string; price: number; stock_quantity: number; is_active: boolean; product_id: string }[] }),
    getShopSettings(),
  ]);

  const dbProducts = productsResult.data;
  const dbVariants = variantsResult.data;

  // Build lookup maps
  const productMap = new Map(dbProducts?.map((p) => [p.id, p]) ?? []);
  const variantMap = new Map(dbVariants?.map((v) => [v.id, v]) ?? []);

  // Validate and replace client prices with DB prices
  const validatedItems = validatedInput.items.map((item) => {
    const product = productMap.get(item.product_id);
    if (!product || !product.is_active) {
      throw new Error("Item is currently unavailable");
    }

    let serverPrice: number;
    let availableStock: number;

    if (item.variant_id) {
      const variant = variantMap.get(item.variant_id);
      if (!variant || !variant.is_active) {
        throw new Error("Item is currently unavailable");
      }
      serverPrice = Number(variant.price);
      availableStock = Number(variant.stock_quantity);
    } else {
      serverPrice = Number(product.price);
      availableStock = Number(product.stock_quantity);
    }

    if (item.quantity > availableStock) {
      logger.warn("Insufficient stock for checkout item", {
        productId: item.product_id,
        variantId: item.variant_id || undefined,
        requested: item.quantity,
        available: availableStock,
      });
      throw new Error("Item is currently unavailable");
    }

    return { ...item, price: serverPrice };
  });

  const { shipping_cost, free_shipping_threshold, allowed_shipping_countries } =
    settings;

  const subtotal = validatedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const shippingCost = subtotal >= free_shipping_threshold ? 0 : shipping_cost;

  // Validate coupon and compute discount amount
  let discountAmount = 0;

  if (validatedInput.couponCode) {
    const trimmedCode = validatedInput.couponCode.trim().toUpperCase();
    const { data: coupon } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", trimmedCode)
      .eq("is_active", true)
      .single();

    if (!coupon) {
      logger.warn("Coupon validation failed: not found", { code: trimmedCode });
      throw new Error("Coupon is not valid");
    }

    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      logger.warn("Coupon validation failed: expired", {
        code: trimmedCode,
        expiresAt: coupon.expires_at,
      });
      throw new Error("Coupon is not valid");
    }

    const maxUses = toNum(coupon.max_uses);
    const currentUses = toNum(coupon.current_uses);
    if (coupon.max_uses !== null && currentUses >= maxUses) {
      logger.warn("Coupon validation failed: max uses reached", {
        code: trimmedCode,
        maxUses,
        currentUses,
      });
      throw new Error("Coupon is not valid");
    }

    const minOrderAmount = coupon.min_order_amount != null ? toNum(coupon.min_order_amount) : null;
    if (minOrderAmount !== null && subtotal < minOrderAmount) {
      logger.warn("Coupon validation failed: minimum order not met", {
        code: trimmedCode,
        minOrderAmount,
        subtotal,
      });
      throw new Error("Coupon is not valid");
    }

    const discountValue = toNum(coupon.discount_value);
    discountAmount =
      coupon.discount_type === "percentage"
        ? subtotal * (discountValue / 100)
        : Math.min(discountValue, subtotal);
  }

  // Apply discount proportionally across product line items.
  // Shipping is never discounted.
  const discountFactor = discountAmount > 0 ? 1 - discountAmount / subtotal : 1;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = validatedItems.map(
    (item) => ({
      price_data: {
        currency: CURRENCY,
        unit_amount: Math.round(item.price * discountFactor * 100),
        product_data: {
          name: item.variant_name
            ? `${item.name} - ${item.variant_name}`
            : item.name,
          images: item.image ? [item.image] : [],
          metadata: {
            product_id: item.product_id,
            variant_id: item.variant_id || "",
            original_unit_price: String(item.price),
          },
        },
      },
      quantity: item.quantity,
    })
  );

  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: CURRENCY,
        unit_amount: Math.round(shippingCost * 100),
        product_data: { name: "Shipping" },
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${SITE_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/cart`,
    billing_address_collection: "required",
    shipping_address_collection: {
      allowed_countries: allowed_shipping_countries as Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[],
    },
    metadata: {
      coupon_code: validatedInput.couponCode || "",
      // Store authoritative discount and original subtotal so the webhook
      // can record correct order totals independently of Stripe rounding.
      discount_amount: discountAmount.toFixed(2),
      original_subtotal: subtotal.toFixed(2),
    },
  });

  return { url: session.url };
}
