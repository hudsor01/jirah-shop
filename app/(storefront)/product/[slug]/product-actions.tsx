"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/providers/cart-provider";
import { cn } from "@/lib/utils";
import type { Product, ProductVariant } from "@/types/database";
import { formatPrice } from "@/lib/format";

export function ProductActions({
  product,
  variants,
}: {
  product: Product;
  variants: ProductVariant[];
}) {
  const { addItem } = useCart();
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants.length > 0 ? variants[0] : null
  );
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  const activePrice = selectedVariant?.price ?? product.price;
  const activeStock = selectedVariant?.stock_quantity ?? product.stock_quantity;
  const isOutOfStock = activeStock === 0;

  function handleAddToCart() {
    if (isOutOfStock) return;

    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      name: product.name,
      variant_name: selectedVariant?.name ?? null,
      price: activePrice,
      quantity,
      image: product.images?.[0] ?? "",
    });

    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Variant Selector */}
      {product.has_variants && variants.length > 0 && (
        <div>
          <p className="mb-2.5 text-sm font-medium text-foreground">
            Variant
          </p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              const variantOutOfStock = variant.stock_quantity === 0;

              return (
                <button
                  key={variant.id}
                  type="button"
                  disabled={variantOutOfStock}
                  onClick={() => {
                    setSelectedVariant(variant);
                    setQuantity(1);
                  }}
                  className={cn(
                    "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:border-primary/50",
                    variantOutOfStock && "opacity-40 cursor-not-allowed line-through"
                  )}
                >
                  {variant.name}
                  {variant.price !== product.price && (
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      ({formatPrice(variant.price)})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <p className="mb-2.5 text-sm font-medium text-foreground">
          Quantity
        </p>
        <div className="inline-flex items-center rounded-lg border border-border">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1 || isOutOfStock}
            className="rounded-r-none"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </Button>
          <span className="flex h-9 w-12 items-center justify-center text-sm font-medium text-foreground border-x border-border">
            {quantity}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.min(activeStock, q + 1))}
            disabled={quantity >= activeStock || isOutOfStock}
            className="rounded-l-none"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        {activeStock > 0 && activeStock <= 10 && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {activeStock} {activeStock === 1 ? "item" : "items"} left in stock
          </p>
        )}
      </div>

      {/* Add to Cart Button */}
      <Button
        type="button"
        size="lg"
        className="w-full text-base font-semibold"
        disabled={isOutOfStock}
        onClick={handleAddToCart}
      >
        <ShoppingBag className="size-5" />
        {isOutOfStock
          ? "Out of Stock"
          : isAdded
            ? "Added to Cart!"
            : "Add to Cart"}
      </Button>
    </div>
  );
}
