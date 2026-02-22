import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Current timestamp as an ISO-8601 string, for use in DB `updated_at` fields. */
export const nowISO = () => new Date().toISOString();

/** Convert Postgres numeric (returned as string by supabase-js) to number safely. */
export function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}
