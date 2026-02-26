import { z } from "zod";

// Shared fragments reused across action files
export const emailSchema = z.string().email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
  .regex(/[0-9]/, "Password must contain at least 1 number");

export const uuidSchema = z.string().uuid("Invalid ID format");

export const paginationSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Helper to extract first user-readable error message from ZodError
export function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
