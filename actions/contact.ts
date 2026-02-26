"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { emailSchema, formatZodError } from "@/lib/validations";

const ContactFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: emailSchema,
  subject: z.string().max(200).nullable(),
  message: z.string().min(1, "Message is required").max(5000, "Message must be under 5000 characters"),
});

export async function submitContactForm(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const raw = {
    name: (formData.get("name") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    subject: (formData.get("subject") as string)?.trim() || null,
    message: (formData.get("message") as string)?.trim(),
  };

  const result = ContactFormSchema.safeParse(raw);
  if (!result.success) {
    return { success: false, error: formatZodError(result.error) };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_submissions").insert({
    name: result.data.name,
    email: result.data.email,
    subject: result.data.subject,
    message: result.data.message,
  });

  if (error) {
    logger.error("Failed to save contact submission", { error: error.message });
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
