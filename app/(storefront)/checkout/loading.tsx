import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16 text-center">
      <Skeleton className="mx-auto size-12 rounded-full" />
      <Skeleton className="mx-auto mt-6 h-8 w-48" />
      <Skeleton className="mx-auto mt-4 h-5 w-72" />
      <Skeleton className="mx-auto mt-8 h-10 w-40 rounded-md" />
    </div>
  );
}
