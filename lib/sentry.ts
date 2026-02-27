/** Shared Sentry configuration constants used across client, server, and edge configs. */

export const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
export const SENTRY_ENVIRONMENT = process.env.NODE_ENV;
export const SENTRY_TRACES_SAMPLE_RATE =
  process.env.NODE_ENV === "production" ? 0.1 : 1.0;
