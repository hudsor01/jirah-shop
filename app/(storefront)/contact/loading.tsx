import { Skeleton } from "@/components/ui/skeleton";

export default function ContactLoading() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      {/* Header */}
      <div className="text-center">
        <Skeleton className="mx-auto h-12 w-56 md:h-14" />
        <Skeleton className="mx-auto mt-4 h-6 w-[400px] max-w-full" />
      </div>

      {/* Contact Info Cards */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="mt-4 h-5 w-24" />
            <Skeleton className="mt-2 h-4 w-full" />
          </div>
        ))}
      </div>

      {/* Contact Form */}
      <div className="mx-auto mt-16 max-w-2xl rounded-2xl border bg-card p-8">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
