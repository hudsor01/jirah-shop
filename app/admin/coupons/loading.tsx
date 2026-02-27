import { Skeleton } from "@/components/ui/skeleton";

export default function AdminCouponsLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32" />
          <Skeleton className="mt-1 h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md" />
      </div>

      {/* Search */}
      <Skeleton className="h-10 w-full sm:w-64" />

      {/* Coupons Table */}
      <div className="rounded-xl border bg-card">
        <div className="grid grid-cols-6 gap-4 border-b p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-6 gap-4 border-b p-4 last:border-0">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
