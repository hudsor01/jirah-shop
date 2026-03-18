import { cn } from "@/lib/utils";

export function BrandName({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif font-bold", className)}>
      <span className="text-primary">J</span>irah
      <span className="ml-0.5">
        <span className="text-primary">S</span>hop
      </span>
    </span>
  );
}
