"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Search, User, Menu, Heart } from "lucide-react";
import { MobileMenu } from "@/components/storefront/mobile-menu";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { useAuth } from "@/providers/auth-provider";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Skincare", href: "/shop/skincare" },
  { label: "Makeup", href: "/shop/makeup" },
  { label: "Hair Care", href: "/shop/hair" },
  { label: "Body", href: "/shop/body" },
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
        {/* Top Announcement Bar */}
        <div className="bg-primary text-primary-foreground">
          <div className="mx-auto max-w-7xl px-6">
            <p className="py-2 text-center text-[11px] font-medium uppercase tracking-widest">
              Free Shipping on Orders $50+
            </p>
          </div>
        </div>

        {/* Main Header Bar */}
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Mobile menu trigger + Logo */}
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="size-5" />
              </Button>

              {/* Logo */}
              <Link href="/" className="flex items-center gap-1.5">
                <span className="font-serif text-2xl font-bold">
                  <span className="text-primary">J</span>irah
                  <span className="ml-0.5 text-lg font-semibold tracking-wide text-muted-foreground">Shop</span>
                </span>
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex lg:items-center lg:gap-0.5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3.5 py-2 text-[13px] font-medium tracking-wide text-muted-foreground transition-colors duration-200 hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: Action Icons */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Search"
                asChild
              >
                <Link href="/shop">
                  <Search className="size-5" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:inline-flex"
                aria-label="Wishlist"
                asChild
              >
                <Link href="/shop">
                  <Heart className="size-5" />
                </Link>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                aria-label={user ? "Account" : "Sign in"}
                asChild
              >
                <Link href={user ? "/account" : "/login"}>
                  <User className="size-5" />
                </Link>
              </Button>

              {/* Cart Drawer — includes SheetTrigger with badge */}
              <CartDrawer />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <MobileMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </>
  );
}
