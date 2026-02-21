/**
 * Unified return type for all server actions.
 *
 * Usage:
 *   return { success: true, data: product };
 *   return { success: false, error: "Not found" };
 *
 * Consumers discriminate on `success`:
 *   if (result.success) { result.data ... } else { result.error ... }
 */
export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Shorthand helpers for creating results. */
export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { success: false, error };
}
