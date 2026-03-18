"use server";

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { emailSchema, formatZodError } from "@/lib/validations";
import { type ActionResult, ok, fail } from "@/lib/action-result";
import { newsletterLimiter } from "@/lib/rate-limit";

export async function subscribeToNewsletter(
  formData: FormData
): Promise<ActionResult<void>> {
  const rateCheck = await newsletterLimiter.check();
  if (!rateCheck.success) {
    return fail("Too many requests, please try again later.");
  }

  const raw = (formData.get("email") as string)?.trim();
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(formatZodError(parsed.error));
  }

  const email = parsed.data;
  const supabase = await createClient();

  // Check if already subscribed (active)
  const { data: existing, error: selectError } = await supabase
    .from("newsletter_subscribers")
    .select("id, unsubscribed_at")
    .eq("email", email)
    .maybeSingle();

  if (selectError) {
    logger.error("Failed to check newsletter subscription", {
      error: selectError.message,
    });
    return fail("Something went wrong. Please try again.");
  }

  if (existing) {
    if (!existing.unsubscribed_at) {
      // Already actively subscribed — return success (not an error)
      return ok(undefined);
    }

    // Previously unsubscribed — re-subscribe
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() })
      .eq("id", existing.id);

    if (updateError) {
      logger.error("Failed to re-subscribe to newsletter", {
        error: updateError.message,
      });
      return fail("Something went wrong. Please try again.");
    }

    return ok(undefined);
  }

  // New subscriber
  const { error: insertError } = await supabase
    .from("newsletter_subscribers")
    .insert({ email });

  if (insertError) {
    logger.error("Failed to subscribe to newsletter", {
      error: insertError.message,
    });
    return fail("Something went wrong. Please try again.");
  }

  return ok(undefined);
}
