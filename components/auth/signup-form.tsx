"use client";

import { useState } from "react";
import { useActionState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/action-result";
import { signUpWithEmail } from "@/actions/auth";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState<ActionResult<void> | null, FormData>(
    signUpWithEmail,
    null
  );
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.success && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="full_name">Full Name</Label>
        <Input
          id="full_name"
          name="full_name"
          type="text"
          placeholder="Your full name"
          required
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
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

      <div className="w-full space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            placeholder="At least 6 characters"
            required
            minLength={6}
            autoComplete="new-password"
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

      <div className="w-full space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={isConfirmPasswordVisible ? "text" : "password"}
            placeholder="Confirm your password"
            required
            minLength={6}
            autoComplete="new-password"
            className="pr-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
            className="text-muted-foreground focus-visible:ring-ring/50 absolute inset-y-0 right-0 rounded-l-none hover:bg-transparent"
          >
            {isConfirmPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
            <span className="sr-only">
              {isConfirmPasswordVisible ? "Hide password" : "Show password"}
            </span>
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="agree_terms"
          checked={agreedToTerms}
          onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="agree_terms" className="text-muted-foreground text-sm font-normal leading-snug">
          I agree to the{" "}
          <a href="/privacy" className="text-foreground hover:underline">privacy policy</a>
          {" "}&amp;{" "}
          <a href="/terms" className="text-foreground hover:underline">terms of service</a>
        </Label>
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={isPending || !agreedToTerms}>
        {isPending ? "Creating account..." : "Create Account"}
      </Button>
    </form>
  );
}
