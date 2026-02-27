import { Skeleton } from "@/components/ui/skeleton";

export default function AboutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Hero Section */}
      <div className="text-center">
        <Skeleton className="mx-auto h-12 w-64 md:h-14" />
        <Skeleton className="mx-auto mt-4 h-6 w-[480px] max-w-full" />
      </div>

      {/* Values Grid */}
      <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 text-center">
            <Skeleton className="mx-auto size-10 rounded-full" />
            <Skeleton className="mx-auto mt-4 h-5 w-28" />
            <Skeleton className="mx-auto mt-2 h-4 w-full" />
            <Skeleton className="mx-auto mt-1 h-4 w-3/4" />
          </div>
        ))}
      </div>

      {/* Story Section */}
      <div className="mt-20 grid gap-12 md:grid-cols-2">
        <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    </div>
  );
}
