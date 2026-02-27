import {
  Heading,
  Text,
  Section,
  Row,
  Column,
  Hr,
  Button,
} from "@react-email/components";
import EmailLayout from "./components/email-layout";
import { BRAND, formatPrice } from "./constants";
import type { OrderEmailProps } from "./types";

export default function OrderConfirmation(props: OrderEmailProps) {
  const {
    orderNumber,
    customerName,
    items,
    subtotal,
    shippingCost,
    discountAmount,
    total,
    couponCode,
    shippingAddress,
    orderDate,
  } = props;

  const formattedDate = new Date(orderDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <EmailLayout previewText={`Your Jirah Shop order #${orderNumber} is confirmed!`}>
      <Heading style={heading}>Thank you for your order!</Heading>

      <Text style={greeting}>Hi {customerName},</Text>
      <Text style={paragraph}>
        Your order has been confirmed and is being prepared. Here&apos;s your
        order summary:
      </Text>

      {/* Order meta */}
      <Section style={orderMeta}>
        <Row>
          <Column>
            <Text style={metaLabel}>Order Number</Text>
            <Text style={metaValue}>#{orderNumber}</Text>
          </Column>
          <Column>
            <Text style={metaLabel}>Date</Text>
            <Text style={metaValue}>{formattedDate}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Line items */}
      {items.map((item, i) => (
        <Section key={i} style={lineItem}>
          <Row>
            <Column style={{ width: "60%" }}>
              <Text style={itemName}>
                {item.productName}
                {item.variantName ? ` — ${item.variantName}` : ""}
              </Text>
              <Text style={itemQty}>Qty: {item.quantity}</Text>
            </Column>
            <Column style={{ width: "20%", textAlign: "center" as const }}>
              <Text style={itemPrice}>{formatPrice(item.unitPrice)}</Text>
            </Column>
            <Column style={{ width: "20%", textAlign: "right" as const }}>
              <Text style={itemTotal}>{formatPrice(item.totalPrice)}</Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Hr style={divider} />

      {/* Totals */}
      <Section style={totalsSection}>
        <Row>
          <Column style={{ width: "60%" }}>
            <Text style={totalLabel}>Subtotal</Text>
          </Column>
          <Column style={{ width: "40%", textAlign: "right" as const }}>
            <Text style={totalValue}>{formatPrice(subtotal)}</Text>
          </Column>
        </Row>
        <Row>
          <Column style={{ width: "60%" }}>
            <Text style={totalLabel}>Shipping</Text>
          </Column>
          <Column style={{ width: "40%", textAlign: "right" as const }}>
            <Text style={totalValue}>
              {shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
            </Text>
          </Column>
        </Row>
        {discountAmount > 0 && (
          <Row>
            <Column style={{ width: "60%" }}>
              <Text style={discountLabel}>
                Discount{couponCode ? ` (${couponCode})` : ""}
              </Text>
            </Column>
            <Column style={{ width: "40%", textAlign: "right" as const }}>
              <Text style={discountValue}>-{formatPrice(discountAmount)}</Text>
            </Column>
          </Row>
        )}
        <Hr style={totalDivider} />
        <Row>
          <Column style={{ width: "60%" }}>
            <Text style={grandTotalLabel}>Total</Text>
          </Column>
          <Column style={{ width: "40%", textAlign: "right" as const }}>
            <Text style={grandTotalValue}>{formatPrice(total)}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Shipping address */}
      <Section>
        <Text style={sectionTitle}>Shipping Address</Text>
        <Text style={addressText}>
          {shippingAddress.name}
          <br />
          {shippingAddress.line1}
          {shippingAddress.line2 ? (
            <>
              <br />
              {shippingAddress.line2}
            </>
          ) : null}
          <br />
          {shippingAddress.city}, {shippingAddress.state}{" "}
          {shippingAddress.postalCode}
          <br />
          {shippingAddress.country}
        </Text>
      </Section>

      {/* CTA */}
      <Section style={ctaSection}>
        <Button style={ctaButton} href={`${BRAND.shopUrl}/account`}>
          View Your Orders
        </Button>
      </Section>

      <Text style={closingText}>
        If you have any questions about your order, feel free to contact us.
        We&apos;re here to help!
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

const orderMeta: React.CSSProperties = {
  margin: "0 0 16px",
};

const metaLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const metaValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.text,
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "16px 0",
};

const lineItem: React.CSSProperties = {
  margin: "8px 0",
};

const itemName: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 2px",
};

const itemQty: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  margin: 0,
};

const itemPrice: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  margin: 0,
};

const itemTotal: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.text,
  margin: 0,
};

const totalsSection: React.CSSProperties = {
  margin: "0 0 8px",
};

const totalLabel: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.muted,
  margin: "4px 0",
};

const totalValue: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  margin: "4px 0",
};

const discountLabel: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.primary,
  margin: "4px 0",
};

const discountValue: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.primary,
  fontWeight: 600,
  margin: "4px 0",
};

const totalDivider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "8px 0",
};

const grandTotalLabel: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "4px 0",
};

const grandTotalValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: BRAND.primary,
  margin: "4px 0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: BRAND.text,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const addressText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "22px",
  margin: "0 0 16px",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0",
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

const closingText: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  lineHeight: "20px",
  margin: 0,
};
