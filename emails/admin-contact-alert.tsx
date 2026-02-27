import {
  Heading,
  Text,
  Section,
  Hr,
} from "@react-email/components";
import EmailLayout from "./components/email-layout";
import { BRAND } from "./constants";
import type { ContactEmailProps } from "./types";

export default function AdminContactAlert(props: ContactEmailProps) {
  const { name, email, subject, message } = props;

  return (
    <EmailLayout previewText={`New contact from ${name}`}>
      <Heading style={heading}>New Contact Submission</Heading>

      <Section style={infoBlock}>
        <Text style={infoLabel}>From</Text>
        <Text style={infoValue}>
          {name} ({email})
        </Text>
      </Section>

      {subject && (
        <Section style={infoBlock}>
          <Text style={infoLabel}>Subject</Text>
          <Text style={infoValue}>{subject}</Text>
        </Section>
      )}

      <Hr style={divider} />

      <Text style={messageLabel}>Message</Text>
      <Section style={quoteBlock}>
        <Text style={messageText}>{message}</Text>
      </Section>

      <Hr style={divider} />

      <Text style={replyNote}>
        Reply directly to this email to respond to the customer.
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

const infoBlock: React.CSSProperties = {
  margin: "0 0 12px",
};

const infoLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const infoValue: React.CSSProperties = {
  fontSize: "15px",
  color: BRAND.text,
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "16px 0",
};

const messageLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const quoteBlock: React.CSSProperties = {
  borderLeft: `3px solid ${BRAND.primary}`,
  paddingLeft: "16px",
  margin: "0 0 16px",
};

const messageText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "22px",
  margin: 0,
  whiteSpace: "pre-wrap" as const,
};

const replyNote: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.primary,
  fontWeight: 600,
  margin: 0,
};
