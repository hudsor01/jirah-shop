"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const categories = [
  { label: "All", href: "/shop" },
  { label: "Skincare", href: "/shop/skincare" },
  { label: "Makeup", href: "/shop/makeup" },
  { label: "Hair Care", href: "/shop/hair-care" },
  { label: "Body Care", href: "/shop/body-care" },
  { label: "Beauty Tools", href: "/shop/beauty-tools" },
];

export function CategoryNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background">
      <div className="mx-auto max-w-7xl px-6">
        <div className="-mb-px flex gap-1 overflow-x-auto py-3 scrollbar-none">
          {categories.map((category) => {
            const isActive =
              pathname === category.href ||
              (category.href !== "/shop" &&
                pathname.startsWith(category.href));

            return (
              <Link
                key={category.href}
                href={category.href}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                {category.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
