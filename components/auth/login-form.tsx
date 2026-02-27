"use client";

import { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, LoaderCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { ActionResult } from "@/lib/action-result";
import { signInWithEmail } from "@/actions/auth";
import { devSignIn } from "@/actions/dev-auth";

const DEV_AUTO_LOGIN =
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN === "true";

export function LoginForm({ redirectTo }: { redirectTo: string }) {
  const [state, formAction, isPending] = useActionState<ActionResult<void> | null, FormData>(
    signInWithEmail,
    null
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [devLoggingIn, setDevLoggingIn] = useState(() => DEV_AUTO_LOGIN);
  const devAttempted = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!DEV_AUTO_LOGIN) return;
    if (devAttempted.current) return;
    devAttempted.current = true;
    devSignIn().then((result) => {
      if (result.success) {
        console.log(`[DevAutoLogin] Signed in as ${result.data.email}`);
        router.push(redirectTo);
      } else {
        console.warn("[DevAutoLogin]", result.error);
        setDevLoggingIn(false);
      }
    });
  }, [redirectTo, router]);

  if (devLoggingIn) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Dev auto-login...
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="redirect" value={redirectTo} />
      <input type="hidden" name="remember" value={rememberMe ? "true" : "false"} />

      {state && !state.success && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="w-full space-y-1">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="Your password"
            required
            autoComplete="current-password"
            className="pr-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsPasswordVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isPasswordVisible ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      </div>

      {/* Remember Me + Forgot Password */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            id="remember-me"
            checked={rememberMe}
            onCheckedChange={(checked) => setRememberMe(checked === true)}
          />
          <Label htmlFor="remember-me" className="cursor-pointer font-normal">
            Remember Me
          </Label>
        </div>
        <Link
          href="/forgot-password"
          className="text-sm hover:underline"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
