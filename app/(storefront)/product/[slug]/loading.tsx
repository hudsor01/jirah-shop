import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-3" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Product Main Section */}
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Left: Image Gallery */}
        <div className="flex flex-col gap-4">
          {/* Main image */}
          <Skeleton className="aspect-square w-full rounded-xl" />
          {/* Thumbnail row */}
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="size-20 shrink-0 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col">
          {/* Brand */}
          <Skeleton className="mb-2 h-5 w-24" />

          {/* Product name */}
          <Skeleton className="h-9 w-4/5 sm:h-10 lg:h-12" />

          {/* Rating */}
          <div className="mt-3 flex items-center gap-2">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="size-4 rounded-sm" />
              ))}
            </div>
            <Skeleton className="h-4 w-36" />
          </div>

          {/* Separator */}
          <Skeleton className="my-5 h-px w-full" />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>

          {/* Short description */}
          <div className="mt-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          {/* Separator */}
          <Skeleton className="my-5 h-px w-full" />

          {/* Variant selector */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-md" />
              ))}
            </div>
          </div>

          {/* Quantity + Add to cart */}
          <div className="mt-6 flex items-center gap-4">
            <Skeleton className="h-10 w-28 rounded-md" />
            <Skeleton className="h-10 flex-1 rounded-md" />
          </div>

          {/* Separator */}
          <Skeleton className="my-5 h-px w-full" />

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-md" />
            ))}
          </div>
        </div>
      </div>

      {/* Below Fold: Tabs skeleton */}
      <div className="mt-16">
        <div className="flex gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-md" />
          ))}
        </div>
        <div className="mt-6 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}
