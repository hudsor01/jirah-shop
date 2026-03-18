import "server-only";

/**
 * Server-only environment variables.
 * Importing this module in a client component will cause a build error.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
      console.warn(`Missing environment variable: ${name}`);
      return "";
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const serverEnv = {
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireEnv("STRIPE_WEBHOOK_SECRET"),
} as const;

/**
 * Lazily-accessed env vars for email — not validated at module load time
 * so that builds succeed without these vars set. They are validated at
 * first use inside `lib/email.ts` and `lib/email-notifications.ts`.
 */
export function getAdminEmail(): string {
  return requireEnv("ADMIN_EMAIL");
}
