"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/providers/cart-provider";
import { createCheckoutSession } from "@/actions/checkout";
import { validateCartPrices } from "@/actions/products";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export function CartDrawer() {
  const {
    items,
    itemCount,
    subtotal,
    shippingCost,
    freeShippingThreshold,
    total,
    couponCode,
    removeItem,
    updateQuantity,
    updateItemPrices,
  } = useCart();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCheckout() {
    startTransition(async () => {
      try {
        // Validate cart prices against server before proceeding
        const { valid, updates } = await validateCartPrices(
          items.map((i) => ({
            product_id: i.product_id,
            variant_id: i.variant_id,
            price: i.price,
          }))
        );

        if (!valid) {
          updateItemPrices(updates);
          toast.info("Some prices have been updated. Please review your cart.");
          return;
        }

        const { url } = await createCheckoutSession(items, couponCode);
        if (url) {
          window.location.href = url;
        }
      } catch (error) {
        toast.error("Checkout failed. Please try again.", {
          description:
            error instanceof Error ? error.message : "Something went wrong",
        });
      }
    });
  }

  const amountUntilFreeShipping = freeShippingThreshold - subtotal;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <ShoppingBag className="size-5" />
          {itemCount > 0 && (
            <Badge className="absolute -top-1 -right-1 flex size-5 items-center justify-center p-0 text-[10px]">
              {itemCount}
            </Badge>
          )}
          <span className="sr-only">Open cart</span>
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-serif">
            Your Cart ({itemCount})
          </SheetTitle>
          <SheetDescription className="sr-only">
            Review the items in your shopping cart
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <ShoppingBag className="size-12 text-muted-foreground/50" />
            <div>
              <p className="font-medium text-foreground">Your cart is empty</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Discover our curated beauty collection.
              </p>
            </div>
            <Button asChild variant="outline" onClick={() => setOpen(false)}>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            {amountUntilFreeShipping > 0 && (
              <p className="px-4 text-xs text-muted-foreground">
                Add ${amountUntilFreeShipping.toFixed(2)} more for free
                shipping!
              </p>
            )}
            {amountUntilFreeShipping <= 0 && (
              <p className="px-4 text-xs font-medium text-primary">
                You qualify for free shipping!
              </p>
            )}

            {/* Cart items */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-4 pb-4">
                {items.map((item) => {
                  const key = `${item.product_id}::${item.variant_id ?? ""}`;
                  return (
                    <div key={key} className="flex gap-3">
                      {/* Product image */}
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
                            No image
                          </div>
                        )}
                      </div>

                      {/* Product details */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div>
                          <p className="text-sm font-medium leading-tight">
                            {item.name}
                          </p>
                          {item.variant_name && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {item.variant_name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          {/* Quantity controls */}
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  item.variant_id,
                                  item.quantity - 1
                                )
                              }
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="size-3" />
                              <span className="sr-only">Decrease quantity</span>
                            </Button>
                            <span className="w-6 text-center text-sm tabular-nums">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon-xs"
                              onClick={() =>
                                updateQuantity(
                                  item.product_id,
                                  item.variant_id,
                                  item.quantity + 1
                                )
                              }
                            >
                              <Plus className="size-3" />
                              <span className="sr-only">Increase quantity</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="ml-1 text-muted-foreground hover:text-destructive"
                              onClick={() =>
                                removeItem(item.product_id, item.variant_id)
                              }
                            >
                              <Trash2 className="size-3" />
                              <span className="sr-only">Remove item</span>
                            </Button>
                          </div>
                          {/* Price */}
                          <p className="text-sm font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer summary */}
            <SheetFooter className="border-t pt-4">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {shippingCost === 0
                      ? "Free"
                      : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <Button
                  className="mt-2 w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    "Checkout"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link href="/shop">Continue Shopping</Link>
                </Button>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
