import { ProductCard } from "@/components/storefront/product-card";
import type { Product } from "@/types/database";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 mb-4">
          <span className="font-serif text-2xl text-muted-foreground/50">?</span>
        </div>
        <h3 className="font-serif text-lg font-semibold text-foreground">
          No products found
        </h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          We couldn&apos;t find any products matching your criteria. Try
          adjusting your search or browse a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
