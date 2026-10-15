"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { AdminUser } from "@/lib/admin/auth";
import { hasModule, type ModuleKey } from "@/lib/admin/modules";
import {
  BoardIcon,
  CardIcon,
  ChatIcon,
  ChefHatIcon,
  FlagIcon,
  GalleryIcon,
  GearIcon,
  LogOutIcon,
  MegaphoneIcon,
  NewOrderIcon,
  OverviewIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/admin/AdminNavIcons";
import type { ComponentType, SVGProps } from "react";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;
type NavItem = { label: string; href: string; icon: NavIcon };
type NavGroup = { label: string; items: NavItem[]; module?: ModuleKey };

// Settings has no `module` — it's always visible (its own page decides how
// much of itself to show based on role), everything else maps to exactly
// one module in src/lib/admin/modules.ts.
const NAV: ((NavItem & { module?: ModuleKey }) | NavGroup)[] = [
  { label: "New Order", href: "/admin/orders/new", icon: NewOrderIcon, module: "new_order" },
  { label: "Overview", href: "/admin", icon: OverviewIcon, module: "overview" },
  { label: "Live Orders", href: "/admin/orders", icon: BoardIcon, module: "live_orders" },
  { label: "Kitchen Batch", href: "/admin/kitchen", icon: ChefHatIcon, module: "kitchen_batch" },
  { label: "Custom Requests", href: "/admin/custom-requests", icon: ChatIcon, module: "custom_requests" },
  { label: "Payments", href: "/admin/payments", icon: CardIcon, module: "payments" },
  { label: "Customers", href: "/admin/customers", icon: UsersIcon, module: "customers" },
  {
    label: "Content & Media",
    module: "content_media",
    items: [
      { label: "Product Catalog", href: "/admin/catalog", icon: GalleryIcon },
      { label: "Flavors & Tags", href: "/admin/catalog/taxonomy", icon: TagIcon },
      { label: "Hero Banner", href: "/admin/hero-banner", icon: FlagIcon },
      { label: "Banners", href: "/admin/banners", icon: MegaphoneIcon },
      { label: "Reviews", href: "/admin/reviews", icon: StarIcon },
    ],
  },
  { label: "Logistics & Capacity", href: "/admin/logistics", icon: TruckIcon, module: "logistics" },
  { label: "Settings", href: "/admin/settings", icon: GearIcon },
];

function isGroup(item: (NavItem & { module?: ModuleKey }) | NavGroup): item is NavGroup {
  return "items" in item;
}

export function AdminSidebar({ admin }: { admin: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const visibleNav = NAV.filter((item) => !item.module || hasModule(admin, item.module));

  // Several hrefs can share a prefix (e.g. "/admin/catalog" and
  // "/admin/catalog/taxonomy") — only the longest matching one should ever
  // light up, otherwise a sub-page lights up both itself and its parent.
  const allHrefs = NAV.flatMap((item) => (isGroup(item) ? item.items.map((i) => i.href) : [item.href]));
  const bestMatch = allHrefs
    .filter((href) => (href === "/admin" ? pathname === href : pathname.startsWith(href)))
    .sort((a, b) => b.length - a.length)[0];

  const linkClass = (href: string) => {
    const active = href === bestMatch;
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
            <p className="font-body text-xs text-brand-chocolate/60">{admin.displayName}</p>
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

        {visibleNav.map((item) =>
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
                  <sub.icon className="h-[18px] w-[18px] flex-none" /> {sub.label}
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
              <item.icon className="h-[18px] w-[18px] flex-none" /> {item.label}
            </Link>
          ),
        )}

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-auto flex items-center gap-2 rounded-xl px-3 py-2 text-left font-body text-sm text-brand-chocolate/70 hover:bg-brand-chocolate/5"
        >
          <LogOutIcon className="h-[18px] w-[18px] flex-none" /> Sign out
        </button>
      </aside>
    </>
  );
}
