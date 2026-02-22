import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { sanitizeRedirect } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const validTypes = ["email", "recovery"] as const;
  const type = validTypes.includes(rawType as "email" | "recovery")
    ? (rawType as "email" | "recovery")
    : null;
  const next = sanitizeRedirect(searchParams.get("next") ?? "/");

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}
