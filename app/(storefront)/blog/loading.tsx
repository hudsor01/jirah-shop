import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <Skeleton className="h-12 w-64 md:h-14" />
        <Skeleton className="mt-4 h-6 w-96 max-w-full" />
      </div>

      {/* Blog Cards Grid — 3 card skeletons */}
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border bg-card"
          >
            {/* Cover image placeholder */}
            <Skeleton className="aspect-[16/10] w-full rounded-none" />

            {/* Card header */}
            <div className="space-y-3 px-5 pt-5 pb-0">
              {/* Tags */}
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-5 w-18 rounded-full" />
              </div>
              {/* Title */}
              <Skeleton className="h-6 w-5/6" />
              {/* Excerpt lines */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            {/* Card footer */}
            <div className="flex items-center justify-between px-5 pt-3 pb-5">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
