"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/providers/cart-provider";
import { formatPrice } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/database";
import { ImageGallery } from "./image-gallery";
import { SizeSelector } from "./size-selector";
import { ColorSelector } from "./color-selector";

interface ProductDisplayProps {
  product: Product;
  variants: ProductVariant[];
  initialSku: string | null;
}

export function ProductDisplay({
  product,
  variants,
  initialSku,
}: ProductDisplayProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addItem } = useCart();

  // ─── Group variants by type ───────────────────────────────
  const sizeVariants = useMemo(
    () => variants.filter((v) => v.variant_type === "size"),
    [variants]
  );
  const colorVariants = useMemo(
    () => variants.filter((v) => v.variant_type === "color"),
    [variants]
  );

  // ─── Resolve initial variant from ?sku= param ────────────
  const initialVariant = useMemo(() => {
    if (!initialSku || variants.length === 0) return variants[0] ?? null;
    return variants.find((v) => v.sku === initialSku) ?? variants[0];
  }, [initialSku, variants]);

  const [selectedVariant, setSelectedVariant] =
    useState<ProductVariant | null>(initialVariant);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    return () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    };
  }, []);

  // ─── Derived state ────────────────────────────────────────
  const activePrice = selectedVariant?.price ?? product.price;
  const activeComparePrice =
    selectedVariant?.compare_at_price ?? product.compare_at_price;
  const activeStock =
    selectedVariant?.stock_quantity ?? product.stock_quantity;
  const isOutOfStock = activeStock === 0;

  const hasDiscount =
    activeComparePrice !== null && activeComparePrice > activePrice;
  const discountPercent = hasDiscount
    ? Math.round(
        ((activeComparePrice! - activePrice) / activeComparePrice!) * 100
      )
    : 0;

  // ─── URL sync ─────────────────────────────────────────────
  function handleVariantSelect(variant: ProductVariant) {
    setSelectedVariant(variant);
    setQuantity(1);

    // Update URL ?sku= param
    const params = new URLSearchParams(searchParams.toString());
    params.set("sku", variant.sku);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // ─── Add to cart ──────────────────────────────────────────
  function handleAddToCart() {
    if (isOutOfStock) return;

    // Use variant-specific image if available, else product image
    const image =
      selectedVariant?.variant_images?.[0] ?? product.images?.[0] ?? "";

    addItem({
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      name: product.name,
      variant_name: selectedVariant?.name ?? null,
      price: activePrice,
      quantity,
      image,
    });

    setIsAdded(true);
    addedTimer.current = setTimeout(() => setIsAdded(false), 2000);
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
      {/* Left: Image Gallery */}
      <ImageGallery
        productName={product.name}
        productImages={product.images ?? []}
        variantImages={selectedVariant?.variant_images ?? null}
      />

      {/* Right: Product Details */}
      <div className="flex flex-col">
        {/* Brand */}
        <div className="mb-2 flex items-center gap-2">
          {product.is_own_brand ? (
            <Badge className="rounded-md bg-primary/90 text-xs text-primary-foreground">
              By Jirah
            </Badge>
          ) : (
            <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {product.brand}
            </p>
          )}
        </div>

        {/* Product Name */}
        <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {product.name}
        </h1>

        {/* Short Description */}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {product.short_description}
        </p>

        <Separator className="my-5" />

        {/* Price — reactive to selected variant */}
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-foreground">
            {formatPrice(activePrice)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-lg text-muted-foreground line-through">
                {formatPrice(activeComparePrice!)}
              </span>
              <Badge variant="destructive" className="rounded-md text-xs">
                Save {discountPercent}%
              </Badge>
            </>
          )}
        </div>

        {/* Variant description (if variant has one) */}
        {selectedVariant?.description && (
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {selectedVariant.description}
          </p>
        )}

        <Separator className="my-5" />

        {/* Variant Selectors */}
        <div className="flex flex-col gap-5">
          {/* Size pills */}
          {sizeVariants.length > 0 && (
            <SizeSelector
              variants={sizeVariants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={handleVariantSelect}
            />
          )}

          {/* Color swatches */}
          {colorVariants.length > 0 && (
            <ColorSelector
              variants={colorVariants}
              selectedId={selectedVariant?.id ?? null}
              onSelect={handleVariantSelect}
            />
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
              <span className="flex h-9 w-12 items-center justify-center border-x border-border text-sm font-medium text-foreground">
                {quantity}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setQuantity((q) => Math.min(activeStock, q + 1))
                }
                disabled={quantity >= activeStock || isOutOfStock}
                className="rounded-l-none"
                aria-label="Increase quantity"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            {activeStock > 0 && activeStock <= 10 && (
              <p className="mt-1.5 text-xs text-muted-foreground">
                {activeStock} {activeStock === 1 ? "item" : "items"} left in
                stock
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

        <Separator className="my-5" />

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="rounded-md px-2.5 py-0.5 text-xs font-normal"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
