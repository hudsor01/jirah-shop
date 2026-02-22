/**
 * Validated environment variables.
 * Throws at module load time if any required variable is missing,
 * so deployment failures are caught at cold start rather than at request time.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),

  // Stripe
  STRIPE_SECRET_KEY: requireEnv("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: requireEnv("STRIPE_WEBHOOK_SECRET"),

  // Site
  NEXT_PUBLIC_SITE_URL: requireEnv("NEXT_PUBLIC_SITE_URL"),
} as const;
