"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Dev-only server action that signs in with credentials stored in
 * server-side env vars (DEV_EMAIL / DEV_PASSWORD — no NEXT_PUBLIC_ prefix).
 * Credentials never reach the client bundle.
 */
export async function devSignIn(): Promise<{
  success?: boolean;
  email?: string;
  error?: string;
}> {
  if (process.env.NODE_ENV !== "development") {
    return { error: "Dev sign-in is only available in development" };
  }

  const email = process.env.DEV_EMAIL;
  const password = process.env.DEV_PASSWORD;

  if (!email || !password) {
    return { error: "DEV_EMAIL and DEV_PASSWORD must be set in .env.local" };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true, email: data.user?.email ?? email };
}
