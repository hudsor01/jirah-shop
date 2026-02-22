"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "@/types/database";

interface ColorSelectorProps {
  variants: ProductVariant[];
  selectedId: string | null;
  onSelect: (variant: ProductVariant) => void;
}

export function ColorSelector({
  variants,
  selectedId,
  onSelect,
}: ColorSelectorProps) {
  if (variants.length === 0) return null;

  const selectedVariant = variants.find((v) => v.id === selectedId);

  return (
    <div>
      <p className="mb-2.5 text-sm font-medium text-foreground">
        Color{selectedVariant ? `: ${selectedVariant.name}` : ""}
      </p>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          const isOutOfStock = variant.stock_quantity === 0;

          return (
            <button
              key={variant.id}
              type="button"
              disabled={isOutOfStock}
              onClick={() => onSelect(variant)}
              title={variant.name}
              className={cn(
                "relative size-9 shrink-0 rounded-full border-2 transition-all",
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-border hover:border-primary/50",
                isOutOfStock && "cursor-not-allowed opacity-40"
              )}
            >
              {/* Swatch: image or hex color */}
              {variant.swatch_image ? (
                <Image
                  src={variant.swatch_image}
                  alt={variant.name}
                  fill
                  sizes="36px"
                  className="rounded-full object-cover"
                />
              ) : (
                <span
                  className="absolute inset-0.5 rounded-full"
                  style={{
                    backgroundColor: variant.color_hex ?? "#ccc",
                  }}
                />
              )}

              {/* Out-of-stock slash overlay */}
              {isOutOfStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="h-px w-full rotate-45 bg-destructive" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
