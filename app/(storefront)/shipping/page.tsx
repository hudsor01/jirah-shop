import type { Metadata } from "next";
import Link from "next/link";
import {
  Truck,
  Sparkles,
  ArrowRight,
  Clock,
  Globe,
  Package,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Shipping Information",
  description:
    "Learn about Jirah Shop shipping rates, delivery times, and international shipping options for your Asian beauty products.",
};

const SHIPPING_RATES = [
  {
    method: "Standard Shipping",
    cost: "$5.99",
    delivery: "3-7 business days",
    note: "Free on orders over $50",
  },
  {
    method: "Express Shipping",
    cost: "$12.99",
    delivery: "1-3 business days",
    note: "Available for domestic orders",
  },
  {
    method: "International Shipping",
    cost: "From $14.99",
    delivery: "7-14 business days",
    note: "Customs duties may apply",
  },
];

const SHIPPING_COUNTRIES = [
  { code: "US", name: "United States", delivery: "3-7 business days" },
  { code: "CA", name: "Canada", delivery: "5-10 business days" },
  { code: "GB", name: "United Kingdom", delivery: "7-14 business days" },
  { code: "AU", name: "Australia", delivery: "7-14 business days" },
];

const INFO_SECTIONS = [
  {
    icon: Clock,
    title: "Processing Time",
    description:
      "All orders are processed within 1-2 business days. Orders placed on weekends or holidays will be processed the next business day. You'll receive a confirmation email as soon as your order is placed and a shipping notification with tracking information once it ships.",
  },
  {
    icon: Package,
    title: "Order Tracking",
    description:
      "Once your order ships, you'll receive an email with a tracking number. You can use this to track your package in real time. If you have an account, tracking information is also available in your order history. Please allow 24 hours for tracking information to update after shipment.",
  },
  {
    icon: MapPin,
    title: "Delivery Details",
    description:
      "We ship to residential and business addresses. Please ensure your shipping address is complete and accurate to avoid delivery delays. If a package is returned due to an incorrect address, re-shipping costs will apply. We are unable to ship to PO boxes for international orders.",
  },
];

export default function ShippingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br/oklch from-primary/5 via-background to-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary">
            <Sparkles className="size-3.5" />
            Delivery
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Shipping
            <span className="text-primary"> Information</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            We carefully package every order to ensure your beauty products
            arrive safely. Here&apos;s everything you need to know about our
            shipping options and delivery times.
          </p>
        </div>

        <div className="pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Shipping Rates */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Truck className="size-6" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Shipping Rates
          </h2>
          <p className="mt-3 text-muted-foreground">
            Flat rate shipping with free delivery on orders over $50
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {SHIPPING_RATES.map((rate) => (
            <div
              key={rate.method}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <h3 className="font-serif text-lg font-semibold text-card-foreground">
                {rate.method}
              </h3>
              <p className="mt-2 text-3xl font-bold text-primary">
                {rate.cost}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {rate.delivery}
              </p>
              <p className="mt-3 text-xs font-medium uppercase tracking-luxury text-primary">
                {rate.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Shipping Countries */}
      <section className="bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Globe className="size-6" />
            </div>
            <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Where We Ship
            </h2>
            <p className="mt-3 text-muted-foreground">
              We currently deliver to the following countries
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SHIPPING_COUNTRIES.map((country) => (
              <div
                key={country.code}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <span className="inline-block text-xs font-semibold uppercase tracking-luxury text-primary">
                  {country.code}
                </span>
                <h3 className="mt-2 font-serif text-lg font-semibold text-card-foreground">
                  {country.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {country.delivery}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Info Sections */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {INFO_SECTIONS.map((section) => (
            <div
              key={section.title}
              className="rounded-2xl border bg-card p-6 shadow-sm"
            >
              <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <section.icon className="size-6" />
              </div>
              <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
                {section.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card/50 py-16 sm:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Questions About Your Delivery?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our support team is happy to help with any shipping inquiries or
            order tracking assistance.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="lg" className="text-base font-semibold">
              <Link href="/contact">
                Contact Us
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base font-semibold"
            >
              <Link href="/shop">Shop Now</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
