import { NextResponse, type NextRequest } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { webhookLimiter } from "@/lib/rate-limit";

/** Validate the metadata we set at checkout creation time. */
const CheckoutMetadataSchema = z.object({
  coupon_code: z.string().optional().default(""),
  discount_amount: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
  original_subtotal: z.string().regex(/^\d+(\.\d{1,2})?$/).default("0"),
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookRate = await webhookLimiter.check();
  if (!webhookRate.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown verification error";
    logger.error('Webhook signature verification failed', { error: message });
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        );
        break;
      }
      case "charge.refunded": {
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      }
      default: {
        logger.info('Unhandled Stripe event type', { eventType: event.type });
      }
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown handler error";
    logger.error('Webhook handler error', { eventType: event.type, error: message });
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// ─── Handlers ────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ["line_items", "line_items.data.price.product"],
  });

  const supabase = createAdminClient();
  const lineItems = fullSession.line_items?.data ?? [];

  // Authoritative totals come from our own metadata (set at checkout creation),
  // not from Stripe's rounding, so order records are always consistent.
  const amountTotal = (fullSession.amount_total ?? 0) / 100;
  const meta = CheckoutMetadataSchema.parse(fullSession.metadata ?? {});
  const discountAmount = parseFloat(meta.discount_amount);
  const originalSubtotal = parseFloat(meta.original_subtotal);

  // Separate the shipping line item from product line items
  let shippingCost = 0;
  const productLineItems: Stripe.LineItem[] = [];

  for (const item of lineItems) {
    const product = item.price?.product;
    const productName =
      typeof product === "object" && product !== null && "name" in product
        ? (product as Stripe.Product).name
        : item.description;

    if (productName === "Shipping") {
      shippingCost = (item.amount_total ?? 0) / 100;
    } else {
      productLineItems.push(item);
    }
  }

  const couponCode = meta.coupon_code || null;

  // Build shipping address
  const shippingInfo = fullSession.collected_information?.shipping_details;
  const stripeAddress = shippingInfo?.address;
  const shippingAddress = {
    name: shippingInfo?.name ?? fullSession.customer_details?.name ?? "",
    line1: stripeAddress?.line1 ?? "",
    line2: stripeAddress?.line2 ?? undefined,
    city: stripeAddress?.city ?? "",
    state: stripeAddress?.state ?? "",
    postal_code: stripeAddress?.postal_code ?? "",
    country: stripeAddress?.country ?? "",
  };

  // ── Idempotency: skip if we already processed this session ──
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_checkout_session_id", fullSession.id)
    .maybeSingle();

  if (existingOrder) {
    logger.info('Order already exists, skipping', { sessionId: fullSession.id });
    return;
  }

  // Try to associate order with a registered user (by email lookup)
  let userId: string | null = null;
  const customerEmail = fullSession.customer_details?.email ?? "";
  if (customerEmail) {
    const { data: profile } = await supabase
      .from("customer_profiles")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();
    userId = profile?.id ?? null;
  }

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      email: customerEmail,
      stripe_checkout_session_id: fullSession.id,
      stripe_payment_intent_id:
        typeof fullSession.payment_intent === "string"
          ? fullSession.payment_intent
          : fullSession.payment_intent?.id ?? null,
      status: "paid",
      subtotal: originalSubtotal,
      shipping_cost: shippingCost,
      discount_amount: discountAmount,
      total: amountTotal,
      shipping_address: shippingAddress,
      coupon_code: couponCode,
    })
    .select("id")
    .single();

  if (orderError) {
    logger.error('Failed to create order', { error: orderError.message });
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // Create order items — store original unit prices from product metadata
  const orderItems = productLineItems.map((item) => {
    const product = item.price?.product;
    const productObj =
      typeof product === "object" && product !== null
        ? (product as Stripe.Product)
        : null;

    // Use the original (pre-discount) unit price stored in metadata
    const originalUnitPrice = productObj?.metadata?.original_unit_price
      ? parseFloat(productObj.metadata.original_unit_price)
      : (item.price?.unit_amount ?? 0) / 100;

    const quantity = item.quantity ?? 1;

    return {
      order_id: order.id,
      product_id: productObj?.metadata?.product_id ?? "",
      variant_id: productObj?.metadata?.variant_id || null,
      product_name: productObj?.name ?? item.description ?? "Unknown Product",
      variant_name: productObj?.metadata?.variant_id
        ? (item.description ?? null)
        : null,
      quantity,
      unit_price: originalUnitPrice,
      total_price: originalUnitPrice * quantity,
    };
  });

  if (orderItems.length > 0) {
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      logger.error('Failed to create order items', { error: itemsError.message });
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }
  }

  // ── Stock decrement (atomic RPC per line item) ──
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
      logger.error(
        "Stock decrement failed — insufficient stock after checkout",
        {
          orderId: order.id,
          productId: item.product_id,
          variantId: item.variant_id || undefined,
          requestedQuantity: item.quantity,
          rpcError: stockError?.message,
        }
      );
      // Continue processing remaining items (partial fulfillment logging, not rollback)
    }
  }

  // Increment coupon uses atomically to prevent race conditions
  if (couponCode) {
    const { error: couponError } = await supabase.rpc("increment_coupon_uses", {
      coupon_code: couponCode,
    });

    if (couponError) {
      // Non-fatal — log but don't fail the webhook
      logger.error('Failed to increment coupon uses', { couponCode, error: couponError.message });
    }
  }

  logger.info('Order created', { orderId: order.id, sessionId: fullSession.id });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    logger.warn('Charge refunded event missing payment_intent ID');
    return;
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ status: "refunded" })
    .eq("stripe_payment_intent_id", paymentIntentId);

  if (error) {
    logger.error('Failed to update order to refunded', { error: error.message });
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  logger.info('Order marked as refunded', { paymentIntentId });
}
