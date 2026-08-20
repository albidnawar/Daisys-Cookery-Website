"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/account/SignOutButton";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My orders" },
  { href: "/account/saved-cakes", label: "Saved cakes" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-brand-chocolate/10 pb-4">
      {links.map((link) => {
        const active = link.href === "/account" ? pathname === "/account" : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-4 py-2 font-body text-sm font-bold transition-colors ${
              active
                ? "bg-brand-orange text-white"
                : "text-brand-chocolate/70 hover:bg-brand-chocolate/5"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <span className="ml-auto">
        <SignOutButton />
      </span>
    </nav>
  );
}
