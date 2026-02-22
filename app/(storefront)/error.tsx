"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Storefront Error]", error);
  }, [error]);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-2">
      {/* Left column */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-20">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="select-none font-serif text-[16rem] font-bold leading-none text-primary/5 sm:text-[22rem]">
            J
          </span>
        </div>
        <div className="relative z-10 flex max-w-lg flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <span className="font-serif text-2xl font-bold text-primary">!</span>
          </div>
          <h1 className="mt-6 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Something Went Wrong
          </h1>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-muted-foreground">
            We hit an unexpected bump. Don&apos;t worry — your cart and account are
            safe. Please try again or head back home.
          </p>
          {error.digest && (
            <p className="mt-3 font-mono text-xs text-muted-foreground/60">
              Error reference: {error.digest}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={reset} size="lg" className="text-base font-semibold">
              <RotateCcw className="size-4" />
              Try Again
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base font-semibold">
              <Link href="/">
                <Home className="size-4" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Right column */}
      <div className="relative max-h-screen w-full p-2 max-lg:hidden">
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-neutral-950">
          <Image
            src="https://cdn.shadcnstudio.com/ss-assets/blocks/marketing/error/image-1.png"
            alt="Error illustration"
            width={406}
            height={406}
            className="w-[clamp(200px,40%,406px)] translate-y-4"
            priority
          />
        </div>
      </div>
    </div>
  );
}
