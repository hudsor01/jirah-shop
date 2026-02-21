"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitContactForm(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const subject = (formData.get("subject") as string)?.trim() || null;
  const message = (formData.get("message") as string)?.trim();

  if (!name || !email || !message) {
    return { success: false, error: "Please fill in all required fields." };
  }

  if (message.length > 5000) {
    return { success: false, error: "Message must be under 5000 characters." };
  }

  const supabase = await createClient();

  const { error } = await supabase.from("contact_submissions").insert({
    name,
    email,
    subject,
    message,
  });

  if (error) {
    console.error("Failed to save contact submission:", error.message);
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
