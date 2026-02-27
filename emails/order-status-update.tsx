import {
  Heading,
  Text,
  Section,
  Hr,
  Button,
} from "@react-email/components";
import EmailLayout from "./components/email-layout";
import { BRAND } from "./constants";
import type { OrderStatusEmailProps } from "./types";

const STATUS_EMOJI: Record<string, string> = {
  shipped: "📦",
  delivered: "✅",
  cancelled: "❌",
  refunded: "💰",
};

export default function OrderStatusUpdate(props: OrderStatusEmailProps) {
  const { orderNumber, customerName, newStatus, statusMessage, trackingUrl } =
    props;

  const emoji = STATUS_EMOJI[newStatus] ?? "📋";

  return (
    <EmailLayout
      previewText={`Your order #${orderNumber} has been ${newStatus}`}
    >
      <Heading style={heading}>
        {emoji} Order Update
      </Heading>

      <Text style={greeting}>Hi {customerName},</Text>
      <Text style={paragraph}>{statusMessage}</Text>

      <Section style={orderBox}>
        <Text style={orderLabel}>Order Number</Text>
        <Text style={orderValue}>#{orderNumber}</Text>
        <Text style={statusBadge}>
          {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
        </Text>
      </Section>

      {trackingUrl && (
        <Section style={ctaSection}>
          <Button style={ctaButton} href={trackingUrl}>
            Track Your Package
          </Button>
        </Section>
      )}

      <Hr style={divider} />

      <Section style={ctaSection}>
        <Button style={secondaryButton} href={`${BRAND.shopUrl}/account`}>
          View Your Orders
        </Button>
      </Section>

      <Text style={closingText}>
        If you have any questions, please don&apos;t hesitate to contact us.
      </Text>
    </EmailLayout>
  );
}

// ── Styles ──────────────────────────────────────────────────

const heading: React.CSSProperties = {
  fontSize: "24px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 16px",
};

const greeting: React.CSSProperties = {
  fontSize: "16px",
  color: BRAND.text,
  margin: "0 0 8px",
};

const paragraph: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  lineHeight: "22px",
  margin: "0 0 24px",
};

const orderBox: React.CSSProperties = {
  backgroundColor: BRAND.primaryLight,
  padding: "20px 24px",
  borderRadius: "8px",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const orderLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const orderValue: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 8px",
};

const statusBadge: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.primary,
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "16px 0",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "16px 0",
};

const ctaButton: React.CSSProperties = {
  backgroundColor: BRAND.primary,
  color: BRAND.white,
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 32px",
  borderRadius: "6px",
  textDecoration: "none",
};

const secondaryButton: React.CSSProperties = {
  backgroundColor: BRAND.white,
  color: BRAND.primary,
  fontSize: "14px",
  fontWeight: 600,
  padding: "12px 32px",
  borderRadius: "6px",
  textDecoration: "none",
  border: `2px solid ${BRAND.primary}`,
};

const closingText: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "20px",
  margin: "8px 0 0",
};
