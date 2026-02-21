import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/database";
import { formatPrice } from "@/lib/format";

export function ProductCard({ product }: { product: Product }) {
  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price > product.price;

  const discountPercent = hasDiscount
    ? Math.round(
        ((product.compare_at_price! - product.price) /
          product.compare_at_price!) *
          100
      )
    : 0;

  const primaryImage = product.images?.[0];

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <Card className="gap-0 overflow-hidden border-border/50 p-0 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1">
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-secondary/30">
          {primaryImage ? (
            <Image
              src={primaryImage}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-linear-to-br/oklch from-primary/10 via-secondary/20 to-accent/10 flex items-center justify-center">
              <span className="font-serif text-3xl font-semibold text-muted-foreground/30">
                {product.name.charAt(0)}
              </span>
            </div>
          )}

          {/* Sale Badge */}
          {hasDiscount && (
            <Badge className="absolute top-3 left-3 rounded-md bg-destructive text-white text-[11px] px-2 py-0.5">
              -{discountPercent}%
            </Badge>
          )}

          {/* Own Brand Badge */}
          {product.is_own_brand && (
            <Badge
              variant="secondary"
              className="absolute top-3 right-3 rounded-md text-[11px] px-2 py-0.5 bg-primary/90 text-primary-foreground"
            >
              Jirah Original
            </Badge>
          )}
        </div>

        {/* Card Body */}
        <CardContent className="flex flex-col gap-2.5 p-4 sm:p-5">
          {/* Brand */}
          <p className="text-[11px] font-medium uppercase tracking-luxury text-muted-foreground">
            {product.is_own_brand ? "By Jirah" : product.brand}
          </p>

          {/* Product Name */}
          <h3 className="font-serif text-sm font-semibold leading-snug text-card-foreground line-clamp-2 group-hover:text-primary transition-colors duration-200 sm:text-[0.95rem]">
            {product.name}
          </h3>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="rounded-md px-1.5 py-0 text-[10px] font-normal text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto flex items-baseline gap-2 pt-2">
            <span className="text-base font-semibold tabular-nums text-foreground">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-sm tabular-nums text-muted-foreground line-through">
                {formatPrice(product.compare_at_price!)}
              </span>
            )}
          </div>

          {/* Stock Indicator */}
          {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
            <p className="text-[11px] font-medium text-destructive">
              Only {product.stock_quantity} left
            </p>
          )}
          {product.stock_quantity === 0 && (
            <p className="text-[11px] font-medium text-muted-foreground">
              Out of stock
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
