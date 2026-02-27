"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { sanitizeRedirect } from "@/lib/auth";
import { emailSchema, passwordSchema, formatZodError } from "@/lib/validations";
import { authLimiter } from "@/lib/rate-limit";
import { type ActionResult, fail } from "@/lib/action-result";

const SignInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  redirect: z.string().optional(),
});

const SignUpSchema = z.object({
  full_name: z.string().min(1, "Full name is required").max(200),
  email: emailSchema,
  password: passwordSchema,
  confirm_password: z.string(),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export async function signInWithEmail(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const rateCheck = await authLimiter.check();
  if (!rateCheck.success) {
    return fail("Too many requests, please try again later.");
  }

  const raw = {
    email: (formData.get("email") as string)?.trim(),
    password: formData.get("password") as string,
    redirect: (formData.get("redirect") as string) || "/",
  };

  const result = SignInSchema.safeParse(raw);
  if (!result.success) {
    return fail(formatZodError(result.error));
  }

  const redirectTo = sanitizeRedirect(result.data.redirect ?? "/");
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return fail(error.message);
  }

  redirect(redirectTo);
}

export async function signUpWithEmail(
  _prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const rateCheck = await authLimiter.check();
  if (!rateCheck.success) {
    return fail("Too many requests, please try again later.");
  }

  const raw = {
    full_name: (formData.get("full_name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    password: formData.get("password") as string,
    confirm_password: formData.get("confirm_password") as string,
  };

  const result = SignUpSchema.safeParse(raw);
  if (!result.success) {
    return fail(formatZodError(result.error));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
    options: {
      data: {
        full_name: result.data.full_name,
      },
    },
  });

  if (error) {
    return fail(error.message);
  }

  redirect("/login?message=Check your email to confirm your account.");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
