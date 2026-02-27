import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Instagram, Twitter, Facebook } from "lucide-react";
import { NewsletterForm } from "@/components/storefront/newsletter-form";
import { FooterYear } from "@/components/storefront/footer-year";

const shopLinks = [
  { label: "Skincare", href: "/shop/skincare" },
  { label: "Makeup", href: "/shop/makeup" },
  { label: "Hair Care", href: "/shop/hair" },
  { label: "Body Care", href: "/shop/body" },
  { label: "Beauty Tools", href: "/shop/tools" },
];

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Blog", href: "/blog" },
];

const supportLinks = [
  { label: "FAQ", href: "/faq" },
  { label: "Shipping", href: "/shipping" },
  { label: "Returns", href: "/returns" },
];

export function Footer() {
  return (
    <footer className="bg-card text-foreground">
      {/* Newsletter Section */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:py-24 text-center">
          <h2 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
            Stay Beautiful
          </h2>
          <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground sm:text-lg">
            Subscribe for exclusive offers, beauty tips, and early access to new
            arrivals.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {/* Footer Links */}
      <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Shop */}
          <div>
            <h3 className="font-serif text-xs font-semibold uppercase tracking-luxury text-foreground">
              Shop
            </h3>
            <ul className="mt-5 space-y-3.5">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-serif text-xs font-semibold uppercase tracking-luxury text-foreground">
              Company
            </h3>
            <ul className="mt-5 space-y-3.5">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-serif text-xs font-semibold uppercase tracking-luxury text-foreground">
              Support
            </h3>
            <ul className="mt-5 space-y-3.5">
              {supportLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-serif text-xs font-semibold uppercase tracking-luxury text-foreground">
              Connect
            </h3>
            <div className="mt-5 flex gap-4">
              <a
                href="#"
                aria-label="Instagram"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Instagram className="size-5" />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Twitter className="size-5" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Facebook className="size-5" />
              </a>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Follow us for the latest beauty inspiration and product drops.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Bottom Bar */}
      <div className="mx-auto max-w-7xl px-6 py-7">
        <div className="flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-muted-foreground tracking-wide">
            &copy; <FooterYear /> Jirah Shop. All rights reserved.
          </p>
          <p className="font-serif text-sm italic text-muted-foreground">
            Asian Beauty, Curated for You
          </p>
        </div>
      </div>
    </footer>
  );
}
