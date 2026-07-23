"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/for-homeowners", label: "For homeowners" },
  { href: "/for-artisans", label: "For artisans" },
  { href: "/trust", label: "Trust" },
];

export function MarketingNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 text-sm md:flex">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={
              active
                ? "font-semibold text-foreground underline underline-offset-4 decoration-primary decoration-2"
                : "text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
