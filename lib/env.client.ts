/**
 * Client-safe environment variables (NEXT_PUBLIC_* only).
 * Safe to import from both client and server components.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const clientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requireEnv(
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
  ),
  NEXT_PUBLIC_SITE_URL: requireEnv("NEXT_PUBLIC_SITE_URL"),
} as const;
