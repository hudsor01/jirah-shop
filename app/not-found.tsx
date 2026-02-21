import Link from "next/link";
import { Home, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6 py-20">
      {/* Background J watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="select-none font-serif text-[20rem] font-bold leading-none text-primary/5 sm:text-[28rem]">
          J
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
        {/* 404 number */}
        <p className="font-serif text-8xl font-bold tracking-tight text-primary sm:text-9xl">
          404
        </p>

        {/* Heading */}
        <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Page Not Found
        </h1>

        {/* Description */}
        <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="text-base font-semibold">
            <Link href="/">
              <Home className="size-4" />
              Back to Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="text-base font-semibold"
          >
            <Link href="/shop">
              <ShoppingBag className="size-4" />
              Browse Shop
            </Link>
          </Button>
        </div>
      </div>

      {/* Decorative blur */}
      <div className="pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
    </div>
  );
}
