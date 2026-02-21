"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Admin Error]", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20">
      <div className="flex max-w-md flex-col items-center text-center">
        {/* Icon */}
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-7 text-destructive" />
        </div>

        {/* Heading */}
        <h1 className="mt-6 font-serif text-2xl font-bold tracking-tight text-foreground">
          Dashboard Error
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Something went wrong while loading the admin dashboard. This could be
          a temporary issue with the database or an unexpected server error.
        </p>

        {/* Error digest for debugging */}
        {error.digest && (
          <p className="mt-3 font-mono text-xs text-muted-foreground/60">
            Reference: {error.digest}
          </p>
        )}

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={reset} className="font-semibold">
            <RotateCcw className="size-4" />
            Try Again
          </Button>
          <Button asChild variant="outline" className="font-semibold">
            <Link href="/">
              <Home className="size-4" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
