"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, User, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Skincare", href: "/shop/skincare" },
  { label: "Makeup", href: "/shop/makeup" },
  { label: "Hair Care", href: "/shop/hair" },
  { label: "Body Care", href: "/shop/body" },
  { label: "Beauty Tools", href: "/shop/tools" },
];

const secondaryLinks = [
  { label: "Blog", href: "/blog" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

interface MobileMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileMenu({ open, onOpenChange }: MobileMenuProps) {
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="text-left">
            <span className="font-serif text-2xl font-bold tracking-tight">
              <span className="text-primary">J</span>irah Shop
            </span>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto px-6 py-6">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-secondary"
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Secondary Navigation */}
          <div className="space-y-1">
            {secondaryLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              );
            })}
          </div>

          <Separator className="my-4" />

          {/* Account & Cart */}
          <div className="space-y-1">
            <SheetClose asChild>
              <Link
                href="/login"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <User className="size-4" />
                Account
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/wishlist"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Heart className="size-4" />
                Wishlist
              </Link>
            </SheetClose>
            <SheetClose asChild>
              <Link
                href="/cart"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <ShoppingBag className="size-4" />
                Cart
              </Link>
            </SheetClose>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
