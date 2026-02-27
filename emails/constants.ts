/**
 * Brand colors for email templates — hex equivalents of the oklch values
 * in globals.css. Email clients don't support oklch, so we convert manually.
 *
 * Source mapping (light mode :root):
 *   primary         → --primary:          oklch(0.64 0.18 6.01)
 *   primaryLight    → --secondary:        oklch(0.94 0.03 350.60)
 *   text            → --foreground:       oklch(0.21 0.06 348.48)
 *   muted           → --muted-foreground: oklch(0.52 0.06 355.80)
 *   border          → --border:           oklch(0.92 0.03 348.44)
 *   background      → --background:       oklch(0.98 0.01 351.16)
 */
export const BRAND = {
  primary: "#e1527b",
  primaryLight: "#fce3ee",
  text: "#2b0a1d",
  muted: "#855a6a",
  border: "#f5dde8",
  background: "#fef6f9",
  white: "#ffffff",
  fontFamily: "'Poppins', Arial, sans-serif",
  shopName: "Jirah Shop",
  shopUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://jirahshop.com",
  shopTagline: "Premium Asian Beauty Products",
} as const;

/** Format a number as a price string (e.g. $29.99). */
export function formatPrice(amount: number): string {
  return `$${amount.toFixed(2)}`;
}
