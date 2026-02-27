import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Link,
  Preview,
  Heading,
  Font,
  Hr,
} from "@react-email/components";
import { BRAND } from "../constants";

type EmailLayoutProps = {
  previewText: string;
  children: React.ReactNode;
};

export default function EmailLayout({ previewText, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Poppins"
          fallbackFontFamily={["Arial", "Helvetica", "sans-serif"]}
          webFont={{
            url: "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap",
            format: "woff2",
          }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Heading style={headerTitle}>{BRAND.shopName}</Heading>
            <Text style={headerTagline}>{BRAND.shopTagline}</Text>
          </Section>

          {/* Content */}
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={footerDivider} />
            <Text style={footerText}>
              <Link href={BRAND.shopUrl} style={footerLink}>
                {BRAND.shopName}
              </Link>{" "}
              &mdash; {BRAND.shopTagline}
            </Text>
            <Text style={footerDisclaimer}>
              You received this email because you placed an order or contacted
              us. If you believe this was sent in error, please ignore it.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ──────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: BRAND.background,
  fontFamily: BRAND.fontFamily,
  margin: 0,
  padding: 0,
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
};

const header: React.CSSProperties = {
  backgroundColor: BRAND.primary,
  padding: "32px 24px",
  textAlign: "center" as const,
  borderRadius: "8px 8px 0 0",
};

const headerTitle: React.CSSProperties = {
  color: BRAND.white,
  fontSize: "28px",
  fontWeight: 600,
  margin: "0 0 4px",
};

const headerTagline: React.CSSProperties = {
  color: BRAND.primaryLight,
  fontSize: "14px",
  margin: 0,
};

const content: React.CSSProperties = {
  backgroundColor: BRAND.white,
  padding: "32px 24px",
};

const footer: React.CSSProperties = {
  padding: "16px 24px 32px",
  textAlign: "center" as const,
};

const footerDivider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "0 0 16px",
};

const footerText: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: "13px",
  margin: "0 0 8px",
};

const footerLink: React.CSSProperties = {
  color: BRAND.primary,
  textDecoration: "none",
};

const footerDisclaimer: React.CSSProperties = {
  color: BRAND.muted,
  fontSize: "11px",
  margin: 0,
  lineHeight: "16px",
};
