import type { Metadata } from "next";
import Link from "next/link";
import { HelpCircle, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about Jirah Shop — ordering, shipping, returns, ingredients, and more.",
};

const FAQS = [
  {
    question: "How do I place an order?",
    answer:
      "Simply browse our shop, add items to your cart, and proceed to checkout. You can create an account or check out as a guest. Once your order is confirmed, you'll receive a confirmation email with your order details.",
  },
  {
    question: "How long does shipping take?",
    answer:
      "Orders are processed within 1-2 business days. Standard domestic delivery takes 3-7 business days. International shipping times vary by destination. You'll receive a tracking number once your order ships.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We offer a 30-day return policy on all unused and sealed products. If you're not completely satisfied, contact our support team to initiate a return. Refunds are processed within 5-10 business days after we receive the item.",
  },
  {
    question: "Are your products cruelty-free?",
    answer:
      "We are committed to clean and conscious beauty. We carefully curate products that prioritize ethical sourcing and formulation. Each product listing includes detailed ingredient information so you can make informed choices.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets including Apple Pay and Google Pay. All payments are processed securely through Stripe.",
  },
  {
    question: "Do you offer gift cards?",
    answer:
      "Yes! Digital gift cards are available in various denominations and make the perfect gift for beauty enthusiasts. Gift cards are delivered via email and never expire.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "We currently ship to the United States, Canada, United Kingdom, and Australia. We're working on expanding to more countries. International orders may be subject to customs duties and taxes.",
  },
  {
    question: "Can I get personalized skincare recommendations?",
    answer:
      "Absolutely! We'd love to help you find the right products for your skin type and concerns. Reach out to us through our contact page with details about your skin, and our beauty team will provide personalized recommendations.",
  },
  {
    question: "How should I store my skincare products?",
    answer:
      "Most products should be stored in a cool, dry place away from direct sunlight. Some items, like vitamin C serums and certain essences, benefit from refrigeration. Check the product description for specific storage instructions.",
  },
  {
    question: "What if I receive a damaged or incorrect item?",
    answer:
      "We're sorry if that happens! Please contact us within 48 hours of receiving your order with photos of the issue. We'll arrange a replacement or full refund at no additional cost to you.",
  },
];

export default function FAQPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br/oklch from-primary/5 via-background to-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary">
            <Sparkles className="size-3.5" />
            Help Center
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Frequently Asked
            <span className="text-primary"> Questions</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Find answers to common questions about ordering, shipping, returns,
            and everything in between. Can&apos;t find what you&apos;re looking
            for? We&apos;re always happy to help.
          </p>
        </div>

        <div className="pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* FAQ Items */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <HelpCircle className="size-6" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Common Questions
          </h2>
          <p className="mt-3 text-muted-foreground">
            Everything you need to know about shopping with us
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border bg-card shadow-sm"
            >
              <summary className="cursor-pointer list-none px-6 py-5 font-serif text-lg font-semibold text-card-foreground transition-colors hover:text-primary">
                {faq.question}
              </summary>
              <div className="px-6 pb-5">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card/50 py-16 sm:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Still Have Questions?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Our beauty team is here to help. Reach out and we&apos;ll get back
            to you as soon as possible.
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
              <Link href="/shop">Browse Products</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
