/**
 * Client-safe environment variables (NEXT_PUBLIC_* only).
 * Safe to import from both client and server components.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    // During build-time static page collection, env vars may not be available.
    // Log a warning instead of throwing so the build can proceed.
    if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
      console.warn(`Missing environment variable: ${name}`);
      return "";
    }
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
