import type { Metadata } from "next";
import Link from "next/link";
import {
  Leaf,
  Heart,
  Globe,
  Sparkles,
  Star,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Jirah Shop was born from a passion for Asian beauty rituals. Learn how we blend time-honored ingredients with modern innovation.",
};

const VALUES = [
  {
    icon: Leaf,
    title: "Clean & Conscious",
    description:
      "Every product is formulated without harsh chemicals. We prioritize clean, skin-loving ingredients that deliver real results.",
  },
  {
    icon: Heart,
    title: "Heritage-Inspired",
    description:
      "Our formulations draw from generations of Asian beauty rituals — time-tested secrets refined with modern science.",
  },
  {
    icon: Globe,
    title: "Inclusive Beauty",
    description:
      "Beauty has no borders. We celebrate every skin tone, type, and story with products that work for everyone.",
  },
  {
    icon: Star,
    title: "Quality First",
    description:
      "From sourcing to packaging, we never compromise. Each product meets our exacting standards before reaching you.",
  },
];

const TIMELINE = [
  {
    year: "2021",
    title: "The Spark",
    description:
      "Founded by Jirah, a first-generation Asian-American entrepreneur inspired by her grandmother's skincare rituals.",
  },
  {
    year: "2022",
    title: "First Collection",
    description:
      "Launched our debut line of serums and essences, blending traditional Asian ingredients with modern formulation science.",
  },
  {
    year: "2023",
    title: "Growing Community",
    description:
      "Expanded to include curated K-beauty and J-beauty picks, building a loyal community of beauty enthusiasts.",
  },
  {
    year: "2024",
    title: "Today & Beyond",
    description:
      "Continuing to innovate with new own-brand collections while curating the best of Asian beauty for our customers.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br/oklch from-primary/5 via-background to-secondary/30">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-luxury text-primary">
            <Sparkles className="size-3.5" />
            Our Story
          </p>

          <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Beauty Rooted in
            <span className="text-primary"> Heritage</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Jirah Shop was born from a passion for Asian beauty rituals passed
            down through generations. We blend time-honored ingredients with
            modern innovation to create products that celebrate every skin tone,
            type, and story.
          </p>
        </div>

        <div className="pointer-events-none absolute -top-40 left-1/2 size-80 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
      </section>

      {/* Founder Story */}
      <section className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl">
            <Image
              src="https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80&fit=crop&auto=format"
              alt="Asian beauty skincare products and botanicals"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Where It All Began
            </h2>

            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Growing up, I watched my grandmother prepare her skincare with
                ingredients from her garden — rice water, green tea, camellia
                oil. These simple rituals were acts of self-care that connected
                us to our heritage.
              </p>
              <p>
                When I moved to the US, I struggled to find products that
                honored those traditions while meeting modern standards. So I
                decided to create them myself.
              </p>
              <p>
                Jirah Shop is my love letter to Asian beauty — a bridge between
                the wisdom of generations past and the innovation of today. Every
                product we make and every brand we curate reflects this
                philosophy.
              </p>
            </div>

            <p className="mt-6 font-serif text-lg font-semibold text-foreground">
              — Jirah, Founder
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              What We Stand For
            </h2>
            <p className="mt-3 text-muted-foreground">
              Our values guide every product we create and every brand we curate
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div
                key={value.title}
                className="rounded-2xl border bg-card p-6 shadow-sm"
              >
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-serif text-lg font-semibold text-card-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="mb-12 text-center">
          <h2 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Journey
          </h2>
        </div>

        <div className="relative space-y-8">
          {/* Vertical line */}
          <div className="absolute left-[1.125rem] top-2 bottom-2 w-px bg-border sm:left-1/2 sm:-translate-x-px" />

          {TIMELINE.map((item, i) => (
            <div
              key={item.year}
              className={`relative flex gap-6 sm:gap-12 ${
                i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
              }`}
            >
              {/* Dot */}
              <div className="absolute left-3 top-1.5 size-3 rounded-full border-2 border-primary bg-background sm:left-1/2 sm:-translate-x-1.5" />

              {/* Content */}
              <div
                className={`ml-10 rounded-2xl border bg-card p-5 shadow-sm sm:ml-0 sm:w-[calc(50%-2rem)] ${
                  i % 2 === 0 ? "sm:text-right" : ""
                }`}
              >
                <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-luxury text-primary">
                  {item.year}
                </span>
                <h3 className="font-serif text-lg font-semibold text-card-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-card/50 py-16 sm:py-20">
        <div className="mx-auto max-w-xl px-6 text-center">
          <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to Discover Your Glow?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Explore our curated collection of Asian beauty products, handpicked
            to help every skin type thrive.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild size="lg" className="text-base font-semibold">
              <Link href="/shop">
                Shop Now
                <ArrowRight className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base font-semibold"
            >
              <Link href="/contact">Get in Touch</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
