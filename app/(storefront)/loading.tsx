import { Skeleton } from "@/components/ui/skeleton";

export default function StorefrontLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center">
        <Skeleton className="h-12 w-80 md:h-16 md:w-[480px]" />
        <Skeleton className="mt-4 h-6 w-96 max-w-full" />
        <Skeleton className="mt-8 h-11 w-40 rounded-md" />
      </div>

      {/* Featured Products Grid */}
      <div className="mt-20">
        <Skeleton className="mx-auto h-8 w-48" />
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border bg-card">
              <Skeleton className="aspect-square w-full rounded-none" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
