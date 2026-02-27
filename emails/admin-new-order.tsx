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

export default function AdminNewOrder(props: OrderEmailProps) {
  const {
    orderNumber,
    customerName,
    customerEmail,
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
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <EmailLayout previewText={`New order #${orderNumber} — ${formatPrice(total)}`}>
      <Heading style={heading}>New Order Received</Heading>

      {/* Customer info */}
      <Section style={infoSection}>
        <Row>
          <Column>
            <Text style={infoLabel}>Customer</Text>
            <Text style={infoValue}>{customerName}</Text>
            <Text style={infoSub}>{customerEmail}</Text>
          </Column>
          <Column>
            <Text style={infoLabel}>Order</Text>
            <Text style={infoValue}>#{orderNumber}</Text>
            <Text style={infoSub}>{formattedDate}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Items */}
      <Text style={sectionTitle}>Items ({items.length})</Text>
      {items.map((item, i) => (
        <Section key={i} style={lineItem}>
          <Row>
            <Column style={{ width: "65%" }}>
              <Text style={itemName}>
                {item.productName}
                {item.variantName ? ` — ${item.variantName}` : ""}
              </Text>
            </Column>
            <Column style={{ width: "10%", textAlign: "center" as const }}>
              <Text style={itemQty}>x{item.quantity}</Text>
            </Column>
            <Column style={{ width: "25%", textAlign: "right" as const }}>
              <Text style={itemTotal}>{formatPrice(item.totalPrice)}</Text>
            </Column>
          </Row>
        </Section>
      ))}

      <Hr style={divider} />

      {/* Totals */}
      <Section>
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
              <Text style={discountVal}>-{formatPrice(discountAmount)}</Text>
            </Column>
          </Row>
        )}
        <Hr style={{ borderColor: BRAND.border, margin: "8px 0" }} />
        <Row>
          <Column style={{ width: "60%" }}>
            <Text style={grandLabel}>Total</Text>
          </Column>
          <Column style={{ width: "40%", textAlign: "right" as const }}>
            <Text style={grandValue}>{formatPrice(total)}</Text>
          </Column>
        </Row>
      </Section>

      <Hr style={divider} />

      {/* Shipping */}
      <Text style={sectionTitle}>Ship To</Text>
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

      {/* CTA */}
      <Section style={ctaSection}>
        <Button style={ctaButton} href={`${BRAND.shopUrl}/admin/orders`}>
          View in Admin
        </Button>
      </Section>
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

const infoSection: React.CSSProperties = {
  margin: "0 0 8px",
};

const infoLabel: React.CSSProperties = {
  fontSize: "12px",
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 4px",
};

const infoValue: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "0 0 2px",
};

const infoSub: React.CSSProperties = {
  fontSize: "13px",
  color: BRAND.muted,
  margin: 0,
};

const divider: React.CSSProperties = {
  borderColor: BRAND.border,
  margin: "16px 0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  color: BRAND.muted,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px",
};

const lineItem: React.CSSProperties = {
  margin: "4px 0",
};

const itemName: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  margin: 0,
};

const itemQty: React.CSSProperties = {
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

const discountVal: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.primary,
  fontWeight: 600,
  margin: "4px 0",
};

const grandLabel: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: BRAND.text,
  margin: "4px 0",
};

const grandValue: React.CSSProperties = {
  fontSize: "18px",
  fontWeight: 600,
  color: BRAND.primary,
  margin: "4px 0",
};

const addressText: React.CSSProperties = {
  fontSize: "14px",
  color: BRAND.text,
  lineHeight: "22px",
  margin: "0 0 16px",
};

const ctaSection: React.CSSProperties = {
  textAlign: "center" as const,
  margin: "24px 0 8px",
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
