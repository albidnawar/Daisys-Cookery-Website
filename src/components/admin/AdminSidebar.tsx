"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NavItem = { label: string; href: string; emoji: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: (NavItem | NavGroup)[] = [
  { label: "New Order", href: "/admin/orders/new", emoji: "➕" },
  { label: "Overview", href: "/admin", emoji: "📊" },
  { label: "Live Orders", href: "/admin/orders", emoji: "🎂" },
  { label: "Kitchen Batch", href: "/admin/kitchen", emoji: "👩‍🍳" },
  { label: "Custom Requests", href: "/admin/custom-requests", emoji: "💬" },
  { label: "Payments", href: "/admin/payments", emoji: "💳" },
  { label: "Customers", href: "/admin/customers", emoji: "👥" },
  {
    label: "Content & Media",
    items: [
      { label: "Product Catalog", href: "/admin/catalog", emoji: "🖼️" },
      { label: "Hero Banner", href: "/admin/hero-banner", emoji: "🎯" },
      { label: "Banners", href: "/admin/banners", emoji: "📣" },
      { label: "Reviews", href: "/admin/reviews", emoji: "⭐" },
    ],
  },
  { label: "Logistics & Capacity", href: "/admin/logistics", emoji: "🚚" },
  { label: "Settings", href: "/admin/settings", emoji: "⚙️" },
];

function isGroup(item: NavItem | NavGroup): item is NavGroup {
  return "items" in item;
}

export function AdminSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const linkClass = (href: string) => {
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return `flex items-center gap-2 rounded-xl px-3 py-2 font-body text-sm ${
      active
        ? "bg-brand-orange/10 font-bold text-brand-orange"
        : "text-brand-chocolate hover:bg-brand-chocolate/5"
    }`;
  };

  const handleSignOut = async () => {
    await createClient().auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <>
      <div className="flex items-center justify-between border-b-2 border-brand-chocolate/10 bg-white p-4 lg:hidden">
        <p className="font-display text-lg font-semibold text-brand-chocolate">
          Daisy&apos;s Cookery
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-10 w-10 items-center justify-center rounded-full text-brand-chocolate hover:bg-brand-chocolate/5"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7 L20 7 M4 12 L20 12 M4 17 L20 17" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-brand-chocolate/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-screen w-72 max-w-[85vw] flex-none flex-col gap-1 overflow-y-auto border-r-2 border-brand-chocolate/10 bg-white p-4 transition-transform duration-200 lg:static lg:z-auto lg:w-64 lg:max-w-none lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-4 flex items-center justify-between px-2">
          <div>
            <p className="font-display text-lg font-semibold text-brand-chocolate">
              Daisy&apos;s Cookery
            </p>
            <p className="font-body text-xs text-brand-chocolate/60">{displayName}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-brand-chocolate hover:bg-brand-chocolate/5 lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6 L18 18 M18 6 L6 18" />
            </svg>
          </button>
        </div>

        {NAV.map((item) =>
          isGroup(item) ? (
            <div key={item.label} className="mt-3">
              <p className="mb-1 px-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/40">
                {item.label}
              </p>
              {item.items.map((sub) => (
                <Link
                  key={sub.href}
                  href={sub.href}
                  onClick={() => setOpen(false)}
                  className={linkClass(sub.href)}
                >
                  <span>{sub.emoji}</span> {sub.label}
                </Link>
              ))}
            </div>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={linkClass(item.href)}
            >
              <span>{item.emoji}</span> {item.label}
            </Link>
          ),
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2 text-left font-body text-sm text-brand-chocolate/70 hover:bg-brand-chocolate/5"
        >
          <span>🚪</span> Sign out
        </button>
      </aside>
    </>
  );
}
