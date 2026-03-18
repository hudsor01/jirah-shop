import type { Metadata } from "next";
import Link from "next/link";
import {
  RotateCcw,
  Sparkles,
  ArrowRight,
  MessageSquare,
  Tag,
  PackageCheck,
  CreditCard,
  ShieldX,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Returns & Refunds",
  description:
    "Learn about Jirah Shop's 30-day return policy, refund process, and how to initiate a return for your beauty products.",
};

const RETURN_STEPS = [
  {
    step: "01",
    icon: MessageSquare,
    title: "Contact Us",
    description:
      "Reach out to our support team through the contact page with your order number and reason for return. We'll respond within 24 hours.",
  },
  {
    step: "02",
    icon: Tag,
    title: "Get Your Return Label",
    description:
      "Once approved, we'll email you a prepaid return shipping label. Print it out and attach it securely to your package.",
  },
  {
    step: "03",
    icon: PackageCheck,
    title: "Ship It Back",
    description:
      "Pack the item securely in its original packaging and drop it off at your nearest shipping location. Keep your tracking receipt.",
  },
  {
    step: "04",
    icon: CreditCard,
    title: "Refund Processed",
    description:
      "Once we receive and inspect the returned item, your refund will be processed within 5-10 business days to your original payment method.",
  },
];

const NON_RETURNABLE = [
  "Opened or used skincare products (for hygiene reasons)",
  "Products without original packaging or seals",
  "Gift cards and digital products",
  "Items marked as final sale or clearance",
  "Free samples and promotional items",
  "Products returned after the 30-day window",
];

export default function ReturnsPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br/oklch from-primary/5 via-background to-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary">
            <Sparkles className="size-3.5" />
            Customer Care
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Returns &
            <span className="text-primary"> Refunds</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Your satisfaction matters to us. If you&apos;re not completely happy
            with your purchase, we make returns simple and straightforward with
            our 30-day return policy.
          </p>
        </div>

        <div className="pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Return Policy Overview */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <RotateCcw className="size-6" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Return Policy
          </h2>
          <p className="mt-3 text-muted-foreground">
            Simple, transparent, and designed with you in mind
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
              30-Day Window
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              You have 30 days from the date of delivery to initiate a return.
              Items must be in their original, unused condition with all
              packaging and seals intact.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <PackageCheck className="size-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
              Unused & Sealed
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To be eligible for a return, products must be unopened and in their
              original sealed condition. This ensures the safety and integrity of
              all beauty products.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CreditCard className="size-6" />
            </div>
            <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
              Quick Refunds
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Once we receive your return, refunds are processed within 5-10
              business days to your original payment method. You&apos;ll receive
              an email confirmation when your refund is issued.
            </p>
          </div>
        </div>
      </section>

      {/* How to Return */}
      <section className="bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              How to Return an Item
            </h2>
            <p className="mt-3 text-muted-foreground">
              Follow these simple steps to return your purchase
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {RETURN_STEPS.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <span className="inline-block text-xs font-semibold uppercase tracking-luxury text-primary">
                  Step {item.step}
                </span>
                <div className="mt-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Non-Returnable Items */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldX className="size-6" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Non-Returnable Items
          </h2>
          <p className="mt-3 text-muted-foreground">
            The following items cannot be returned for hygiene and safety reasons
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <ul className="space-y-3">
            {NON_RETURNABLE.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-primary/60" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card/50 py-16 sm:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Need to Start a Return?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our customer care team will guide you through the process and make
            sure everything goes smoothly.
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
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
