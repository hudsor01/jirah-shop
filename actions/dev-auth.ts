"use server";

import { createClient } from "@/lib/supabase/server";
import { type ActionResult, ok, fail } from "@/lib/action-result";

// No external input — reads from process.env only. No Zod validation required.

/**
 * Dev-only server action that signs in with credentials stored in
 * server-side env vars (DEV_EMAIL / DEV_PASSWORD — no NEXT_PUBLIC_ prefix).
 * Credentials never reach the client bundle.
 */
export async function devSignIn(): Promise<ActionResult<{ email: string }>> {
  if (process.env.NODE_ENV !== "development") {
    return fail("devSignIn is not available outside of development");
  }

  if (process.env.ALLOW_DEV_AUTH !== "true") {
    return fail("devSignIn requires ALLOW_DEV_AUTH=true in environment");
  }

  const email = process.env.DEV_EMAIL;
  const password = process.env.DEV_PASSWORD;

  if (!email || !password) {
    return fail("DEV_EMAIL and DEV_PASSWORD must be set in .env.local");
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return fail(error.message);
  }

  return ok({ email: data.user?.email ?? email });
}
