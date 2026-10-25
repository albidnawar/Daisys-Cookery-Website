"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LinkButton } from "@/components/ui/Button";

const navLinks = [
  { href: "/browse", label: "Cakes" },
  { href: "/customise/new", label: "Customise" },
  { href: "/buying-options", label: "Pickup & delivery" },
  { href: "/about", label: "Our shop" },
];

export function SiteHeader({ customerEmail }: { customerEmail?: string | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  // The order-form page (the direct link sent to customers for custom
  // designs) has its own prominent submit flow — the top-bar "Order a
  // cake" CTA there is redundant, so it's left out on this one page only.
  // The hamburger menu's copy of the button still shows everywhere,
  // order-form included.
  const isOrderForm = pathname?.startsWith("/order-form") ?? false;
  const accountLink = customerEmail
    ? { href: "/account", label: "My account" }
    : { href: "/account/login", label: "Sign in" };

  return (
    <header className="sticky top-0 z-40 border-b border-brand-chocolate/10 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 sm:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="Daisy's Cookery"
            width={44}
            height={44}
            className="h-11 w-11"
            priority
          />
          <span className="hidden font-display text-xl font-semibold tracking-tight text-brand-chocolate sm:inline">
            Daisy&apos;s Cookery
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-body text-sm font-medium text-brand-chocolate hover:text-brand-orange"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={accountLink.href}
            className="font-body text-sm font-medium text-brand-chocolate hover:text-brand-orange"
          >
            {accountLink.label}
          </Link>
        </nav>

        {!isOrderForm && (
          <LinkButton href="/browse" className="ml-auto hidden md:inline-flex">
            Order a cake
          </LinkButton>
        )}

        <button
          type="button"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-brand-chocolate md:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <path d="M6 6 L18 18 M18 6 L6 18" />
            ) : (
              <path d="M4 7 L20 7 M4 12 L20 12 M4 17 L20 17" />
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-brand-chocolate/10 px-4 py-3 md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-3 py-2 font-body text-sm font-medium text-brand-chocolate hover:bg-brand-chocolate/5"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={accountLink.href}
            className="rounded-xl px-3 py-2 font-body text-sm font-medium text-brand-chocolate hover:bg-brand-chocolate/5"
            onClick={() => setMobileOpen(false)}
          >
            {accountLink.label}
          </Link>
          <LinkButton href="/browse" className="mt-2 w-full">
            Order a cake
          </LinkButton>
        </nav>
      )}
    </header>
  );
}
