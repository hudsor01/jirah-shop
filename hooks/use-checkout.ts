"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useCart } from "@/providers/cart-provider";
import { createCheckoutSession } from "@/actions/checkout";
import { validateCartPrices } from "@/actions/products";

/**
 * Shared checkout flow used by both the cart drawer and the cart page.
 * Validates prices against the server, then creates a Stripe Checkout session.
 */
export function useCheckout() {
  const { items, couponCode, updateItemPrices } = useCart();
  const [isPending, startTransition] = useTransition();

  function checkout() {
    startTransition(async () => {
      try {
        // Validate cart prices against server before proceeding
        const priceResult = await validateCartPrices(
          items.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            price: i.price,
          }))
        );

        if (!priceResult.success) {
          throw new Error(priceResult.error);
        }

        if (!priceResult.data.valid) {
          updateItemPrices(priceResult.data.updates);
          toast.info(
            "Some prices have been updated. Please review your cart."
          );
          return;
        }

        const checkoutResult = await createCheckoutSession(items, couponCode);
        if (!checkoutResult.success) {
          throw new Error(checkoutResult.error);
        }
        if (checkoutResult.data.url) {
          window.location.href = checkoutResult.data.url;
        }
      } catch (error) {
        toast.error("Checkout failed. Please try again.", {
          description:
            error instanceof Error ? error.message : "Something went wrong",
        });
      }
    });
  }

  return { checkout, isPending };
}
