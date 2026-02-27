import {
  Heading,
  Text,
  Section,
  Hr,
} from "@react-email/components";
import EmailLayout from "./components/email-layout";
import { BRAND } from "./constants";
import type { ContactEmailProps } from "./types";

export default function ContactAutoReply(props: ContactEmailProps) {
  const { name, subject, message } = props;

  return (
    <EmailLayout previewText="We received your message — Jirah Shop">
      <Heading style={heading}>We got your message!</Heading>

      <Text style={greeting}>Hi {name},</Text>
      <Text style={paragraph}>
        Thank you for reaching out to Jirah Shop. We&apos;ve received your
        message and our team will get back to you within 24 hours.
      </Text>

      <Hr style={divider} />

      {/* Quoted message */}
      <Section>
        <Text style={quoteLabel}>Your message:</Text>
        {subject && <Text style={quoteSubject}>Subject: {subject}</Text>}
        <Section style={quoteBlock}>
          <Text style={quoteText}>{message}</Text>
        </Section>
      </Section>

      <Hr style={divider} />

      <Text style={closingText}>
        In the meantime, feel free to browse our latest products. We appreciate
        your interest in Jirah Shop!
      </Text>
      <Text style={signoff}>
        Best regards,
        <br />
        The Jirah Shop Team
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

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "16px 0",
};

const quoteLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const quoteSubject: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 8px",
};

const quoteBlock: React.CSSProperties = {
  borderLeft: `3px solid ${BRAND.primary}`,
  paddingLeft: "16px",
  margin: "0 0 16px",
};

const quoteText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "22px",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const closingText: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "20px",
  margin: "0 0 16px",
};

const signoff: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "22px",
  margin: 0,
};
