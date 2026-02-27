import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

/**
 * Validates the current user is an admin.
 * Returns the user on success; throws on failure.
 *
 * Wrapped with React.cache() so multiple calls within a single server
 * request (e.g. multiple server actions or layout + page) reuse the
 * same getUser() result — no redundant auth round-trips.
 *
 * Usage:  const user = await requireAdmin();
 */
export const requireAdmin = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: not authenticated");
  }

  if (user.app_metadata?.role !== "admin") {
    throw new Error("Forbidden: admin access required");
  }

  return user;
});

/**
 * Validates that a redirect target is a safe relative path.
 * Prevents open-redirect attacks by rejecting absolute URLs,
 * protocol-relative URLs (//evil.com), and other schemes.
 */
export function sanitizeRedirect(target: string): string {
  // Must start with a single slash and NOT be protocol-relative
  if (!target.startsWith("/") || target.startsWith("//")) {
    return "/";
  }

  // Block backslash tricks (e.g. /\evil.com)
  if (target.includes("\\")) {
    return "/";
  }

  return target;
}

/**
 * Escapes special PostgREST filter characters in user-supplied search
 * strings to prevent filter injection via `.or()` or `.ilike()`.
 */
export function sanitizeSearchInput(input: string): string {
  // Remove characters that have meaning in PostgREST filter strings.
  // Also strip } to prevent breaking array containment syntax cs.{...},
  // and escape % / _ so they are treated as literals in ilike queries.
  return input
    .replace(/[,()\\}]/g, "")
    .replace(/[%_]/g, "\\$&");
}
