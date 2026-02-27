import "server-only";

import { Resend } from "resend";
import type React from "react";
import { logger } from "@/lib/logger";

// Lazy-initialise so the module can be imported at build time
// (when RESEND_API_KEY may not be set yet).
let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error(
        "Missing RESEND_API_KEY — set it in your environment variables."
      );
    }
    _resend = new Resend(key);
  }
  return _resend;
}

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  replyTo?: string;
};

/**
 * Send an email via Resend with structured error logging.
 * Returns { success, messageId? } — never throws.
 */
export async function sendEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string }> {
  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: "Jirah Shop <orders@jirahshop.com>",
      to: options.to,
      subject: options.subject,
      react: options.react,
      replyTo: options.replyTo,
    });

    if (error) {
      logger.error("Email send failed", {
        error: error.message,
        to: Array.isArray(options.to) ? options.to.join(",") : options.to,
        subject: options.subject,
      });
      return { success: false };
    }

    logger.info("Email sent", {
      messageId: data?.id,
      to: Array.isArray(options.to) ? options.to.join(",") : options.to,
      subject: options.subject,
    });

    return { success: true, messageId: data?.id };
  } catch (err) {
    logger.exception(err, {
      to: Array.isArray(options.to) ? options.to.join(",") : options.to,
      subject: options.subject,
    });
    return { success: false };
  }
}

/**
 * Fire-and-forget email sending.
 * Used in webhooks where email failure must NOT block the response.
 */
export function sendEmailAsync(options: SendEmailOptions): void {
  sendEmail(options).catch((err) => {
    logger.exception(err, {
      to: Array.isArray(options.to) ? options.to.join(",") : options.to,
      subject: options.subject,
    });
  });
}
