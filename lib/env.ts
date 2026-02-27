/**
 * Barrel re-export for backward compatibility.
 *
 * Prefer importing from `@/lib/env.client` or `@/lib/env.server` directly.
 * This file merges both into a single `env` object for existing callers
 * that are always server-side.
 *
 * NOTE: Because this re-exports from env.server.ts (which imports "server-only"),
 * this module can ONLY be used in server contexts.
 */

import { clientEnv } from "./env.client";
import { serverEnv } from "./env.server";

export const env = {
  ...clientEnv,
  ...serverEnv,
} as const;
