import type { Metadata } from "next";
import Link from "next/link";
import {
  Mail,
  MapPin,
  Clock,
  MessageCircle,
  Instagram,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ContactForm } from "@/components/storefront/contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Have questions about our Asian beauty products? We'd love to hear from you. Reach out to the Jirah Shop team.",
};

const CONTACT_INFO = [
  {
    icon: Mail,
    title: "Email Us",
    detail: "hello@jirah.shop",
    description: "We respond within 24 hours",
  },
  {
    icon: Clock,
    title: "Business Hours",
    detail: "Mon-Fri, 9am-5pm PST",
    description: "Weekend orders processed Monday",
  },
  {
    icon: MapPin,
    title: "Based In",
    detail: "Los Angeles, California",
    description: "Shipping nationwide",
  },
  {
    icon: Instagram,
    title: "Follow Us",
    detail: "@jirahshop",
    description: "Beauty tips & behind the scenes",
  },
];

const FAQ_ITEMS = [
  {
    question: "How long does shipping take?",
    answer:
      "Standard shipping takes 3-5 business days. Free shipping on orders over $50.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Currently we ship within the United States. International shipping coming soon.",
  },
  {
    question: "What is your return policy?",
    answer:
      "We accept returns within 30 days of purchase for unopened products in original packaging.",
  },
  {
    question: "Are your products cruelty-free?",
    answer:
      "Yes! All Jirah-branded products are cruelty-free and never tested on animals.",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br/oklch from-primary/5 via-background to-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16 text-center sm:py-24">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary">
            <MessageCircle className="size-3.5" />
            Get in Touch
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            We&apos;d Love to
            <span className="text-primary"> Hear </span>
            From You
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
            Questions about our products, your order, or just want to say hello?
            Drop us a line and we&apos;ll get back to you soon.
          </p>
        </div>

        <div className="pointer-events-none absolute -top-40 right-0 size-60 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Contact Grid */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-5 lg:gap-16">
          {/* Contact Form */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif text-2xl">
                  Send Us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll respond within 24
                  hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContactForm />
              </CardContent>
            </Card>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            {CONTACT_INFO.map((info) => (
              <div
                key={info.title}
                className="flex gap-4 rounded-2xl border bg-card p-5 shadow-sm"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <info.icon className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif text-sm font-semibold text-card-foreground">
                    {info.title}
                  </h3>
                  <p className="text-sm font-medium text-foreground">
                    {info.detail}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {info.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6">
          <div className="mb-10 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-muted-foreground">
              Quick answers to common questions
            </p>
          </div>

          <div className="space-y-4">
            {FAQ_ITEMS.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <h3 className="font-serif text-base font-semibold text-card-foreground">
                  {item.question}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              Can&apos;t find what you&apos;re looking for?
            </p>
            <Button asChild variant="link" className="mt-1">
              <Link href="mailto:hello@jirah.shop">
                Email us directly
                <ArrowRight className="ml-1 size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
