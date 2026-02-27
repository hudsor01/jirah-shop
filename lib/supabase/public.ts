import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Public client for use inside "use cache" functions.
// Uses the publishable (anon) key — same permissions as the server client
// but without cookies, so it's safe inside Next.js cache scopes.
// RLS applies normally — only public data is readable.
let publicClient: SupabaseClient | null = null;

export function createPublicClient(): SupabaseClient {
  if (!publicClient) {
    publicClient = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return publicClient;
}
