import "server-only";

import { createElement } from "react";
import { sendEmail, sendEmailAsync } from "@/lib/email";
import { getAdminEmail } from "@/lib/env.server";
import type {
  OrderEmailProps,
  ContactEmailProps,
  OrderStatusEmailProps,
} from "@/emails/types";
import OrderConfirmation from "@/emails/order-confirmation";
import ContactAutoReply from "@/emails/contact-auto-reply";
import AdminNewOrder from "@/emails/admin-new-order";
import AdminContactAlert from "@/emails/admin-contact-alert";
import OrderStatusUpdate from "@/emails/order-status-update";

// ─── Order Emails ────────────────────────────────────────

/**
 * Send order confirmation to the customer.
 * Fire-and-forget — used in webhooks where email must NOT block the response.
 */
export function notifyOrderConfirmation(props: OrderEmailProps): void {
  sendEmailAsync({
    to: props.customerEmail,
    subject: `Order Confirmed — #${props.orderNumber}`,
    react: createElement(OrderConfirmation, props),
  });
}

/**
 * Notify admin of a new order.
 * Fire-and-forget — used in webhooks.
 */
export function notifyAdminNewOrder(props: OrderEmailProps): void {
  sendEmailAsync({
    to: getAdminEmail(),
    subject: `New Order #${props.orderNumber} — $${props.total.toFixed(2)}`,
    react: createElement(AdminNewOrder, props),
  });
}

// ─── Contact Emails ──────────────────────────────────────

/**
 * Send auto-reply to the customer who submitted a contact form.
 * Awaitable — called after DB insert in server action.
 */
export function notifyContactAutoReply(
  props: ContactEmailProps
): Promise<{ success: boolean; messageId?: string }> {
  return sendEmail({
    to: props.email,
    subject: "We received your message — Jirah Shop",
    react: createElement(ContactAutoReply, props),
  });
}

/**
 * Alert admin about a new contact submission.
 * Uses replyTo so the admin can respond directly to the customer.
 */
export function notifyAdminContactAlert(
  props: ContactEmailProps
): Promise<{ success: boolean; messageId?: string }> {
  return sendEmail({
    to: getAdminEmail(),
    subject: `New Contact: ${props.subject || "No subject"} — ${props.name}`,
    react: createElement(AdminContactAlert, props),
    replyTo: props.email,
  });
}

// ─── Order Status Emails ─────────────────────────────────

const STATUS_MESSAGES: Record<string, string> = {
  shipped: "Great news! Your order has been shipped and is on its way.",
  delivered: "Your order has been delivered. We hope you love your purchase!",
  cancelled:
    "Your order has been cancelled. If you have any questions, please contact us.",
  refunded:
    "Your refund has been processed. It may take 5-10 business days to appear.",
};

/**
 * Notify customer of an order status change.
 * Awaitable — called in the updateOrderStatus server action.
 */
export function notifyOrderStatusUpdate(
  customerEmail: string,
  props: Omit<OrderStatusEmailProps, "statusMessage"> & {
    statusMessage?: string;
  }
): Promise<{ success: boolean; messageId?: string }> {
  const statusMessage =
    props.statusMessage ??
    STATUS_MESSAGES[props.newStatus] ??
    `Your order status has been updated to: ${props.newStatus}.`;

  return sendEmail({
    to: customerEmail,
    subject: `Order #${props.orderNumber} — ${props.newStatus.charAt(0).toUpperCase() + props.newStatus.slice(1)}`,
    react: createElement(OrderStatusUpdate, {
      ...props,
      statusMessage,
    }),
  });
}
