import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

// Admin client using service role key — bypasses RLS
// Only use in server-side contexts (webhooks, server actions that need elevated access)
export function createAdminClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
