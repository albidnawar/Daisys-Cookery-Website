"use client";

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
    <aside className="flex h-screen w-64 flex-none flex-col gap-1 overflow-y-auto border-r-2 border-brand-chocolate/10 bg-white p-4">
      <div className="mb-4 px-2">
        <p className="font-display text-lg font-semibold text-brand-chocolate">
          Daisy&apos;s Cookery
        </p>
        <p className="font-body text-xs text-brand-chocolate/60">{displayName}</p>
      </div>

      {NAV.map((item) =>
        isGroup(item) ? (
          <div key={item.label} className="mt-3">
            <p className="mb-1 px-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/40">
              {item.label}
            </p>
            {item.items.map((sub) => (
              <Link key={sub.href} href={sub.href} className={linkClass(sub.href)}>
                <span>{sub.emoji}</span> {sub.label}
              </Link>
            ))}
          </div>
        ) : (
          <Link key={item.href} href={item.href} className={linkClass(item.href)}>
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
  );
}
