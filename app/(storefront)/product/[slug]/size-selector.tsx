"use client";

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/format";
import type { ProductVariant } from "@/types/database";

interface SizeSelectorProps {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

export function SizeSelector({
  variants,
  selectedId,
  onSelect,
}: SizeSelectorProps) {
  if (variants.length === 0) return null;

  return (
    <div>
      <p className="mb-2.5 text-sm font-medium text-foreground">Size</p>
      <div className="flex flex-wrap gap-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          const isOutOfStock = variant.stock_quantity === 0;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onSelect(variant)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                isSelected
                  ? "border-primary bg-primary/10 text-primary ring-1 ring-primary"
                  : "border-border bg-background text-foreground hover:border-primary/50",
                isOutOfStock &&
                  "cursor-not-allowed opacity-40 line-through"
              )}
            >
              {variant.name}
              {variant.price !== variants[0]?.price && (
                <span className="ml-1.5 text-xs text-muted-foreground">
                  ({formatPrice(variant.price)})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
