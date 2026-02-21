import type { Metadata } from "next";
import { Poppins, Playfair_Display, Roboto_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/providers/cart-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { getShopSettings } from "@/actions/settings";
import { SITE_URL } from "@/lib/constants";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Jirah Shop — Asian Beauty, Curated for You",
    template: "%s | Jirah Shop",
  },
  description:
    "Shop premium Asian beauty products at Jirah Shop. From K-beauty skincare to J-beauty essentials, discover curated serums, moisturizers, masks & makeup for every skin type.",
  keywords: [
    "Asian beauty",
    "K-beauty",
    "J-beauty",
    "Korean skincare",
    "Japanese beauty",
    "skincare routine",
    "beauty products",
    "serums",
    "moisturizers",
    "sheet masks",
    "lip tints",
    "sunscreen",
    "cleansing oil",
    "Asian makeup",
    "beauty tools",
    "gua sha",
  ],
  openGraph: {
    siteName: "Jirah Shop",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jirah Shop — Asian Beauty, Curated for You",
    description:
      "Shop premium Asian beauty products at Jirah Shop. From K-beauty skincare to J-beauty essentials, discover curated serums, moisturizers, masks & makeup for every skin type.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getShopSettings();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppins.variable} ${playfairDisplay.variable} ${robotoMono.variable} antialiased`}
      >
        <AuthProvider>
          <CartProvider
            shippingCost={settings.shipping_cost}
            freeShippingThreshold={settings.free_shipping_threshold}
          >
            {children}
            <Toaster richColors position="bottom-right" />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
