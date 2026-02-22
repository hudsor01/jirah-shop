"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (!password || !confirmPassword) {
      setError("Both fields are required.");
      setIsPending(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setIsPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsPending(false);
      return;
    }

    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setIsPending(false);
      return;
    }

    router.push("/login?message=Your password has been updated successfully.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* New Password */}
      <div className="w-full space-y-2">
        <Label htmlFor="password">New Password</Label>
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

      {/* Confirm Password */}
      <div className="w-full space-y-2">
        <Label htmlFor="confirm_password">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirm_password"
            name="confirm_password"
            type={isConfirmPasswordVisible ? "text" : "password"}
            placeholder="Confirm your new password"
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

      <Button type="submit" className="w-full" size="lg" disabled={isPending}>
        {isPending ? "Updating..." : "Set New Password"}
      </Button>
    </form>
  );
}
