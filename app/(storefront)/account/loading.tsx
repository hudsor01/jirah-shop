import { Skeleton } from "@/components/ui/skeleton";

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-10">
        <Skeleton className="h-10 w-48 sm:h-12" />
        <Skeleton className="mt-2 h-5 w-72" />
      </div>

      {/* Profile Card */}
      <div className="mb-8 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-44" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-36" />
          </div>
          {/* Email */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-5 w-48" />
          </div>
          {/* Member since */}
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-32" />
          </div>
        </div>
      </div>

      {/* Order History Card */}
      <div className="rounded-xl border bg-card">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-2 h-4 w-44" />
        </div>

        {/* Order Table Skeleton */}
        <div className="px-6 pb-6">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 border-b pb-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="ml-auto h-4 w-10" />
          </div>

          {/* Table rows */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-4 border-b py-4 last:border-0"
            >
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="ml-auto h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
