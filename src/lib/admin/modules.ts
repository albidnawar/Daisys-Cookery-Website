// The unit of access control for admin roles. Each nav section in
// AdminSidebar maps to exactly one of these (the four Content & Media
// pages share the single "content_media" module, matching how the
// business actually thinks about "marketing only touches content").
// Settings is deliberately NOT here — it stays hardcoded owner-only in
// requireOwner()/getCurrentAdmin() call sites, never assignable to any
// role, since it holds store financials and other admins' access.
export const MODULES = [
  { key: "new_order", label: "New Order" },
  { key: "overview", label: "Overview" },
  { key: "live_orders", label: "Live Orders" },
  { key: "courier_messages", label: "Courier Messages" },
  { key: "delivery_riders", label: "Delivery Man Details" },
  { key: "kitchen_batch", label: "Kitchen Batch" },
  { key: "custom_requests", label: "Custom Requests" },
  { key: "payments", label: "Payments" },
  { key: "customers", label: "Customers" },
  { key: "content_media", label: "Content & Media" },
  { key: "logistics", label: "Logistics & Capacity" },
] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];

export const MODULE_LABELS: Record<ModuleKey, string> = Object.fromEntries(
  MODULES.map((m) => [m.key, m.label]),
) as Record<ModuleKey, string>;

// Where requireModulePage sends an admin who lacks a module they tried to
// open directly by URL — also used to find the first page an admin with a
// restricted role should land on.
export const MODULE_ROUTES: Record<ModuleKey, string> = {
  new_order: "/admin/orders/new",
  overview: "/admin",
  live_orders: "/admin/orders",
  courier_messages: "/admin/courier-messages",
  delivery_riders: "/admin/delivery-riders",
  kitchen_batch: "/admin/kitchen",
  custom_requests: "/admin/custom-requests",
  payments: "/admin/payments",
  customers: "/admin/customers",
  content_media: "/admin/catalog",
  logistics: "/admin/logistics",
};

export function isModuleKey(value: string): value is ModuleKey {
  return (MODULES as readonly { key: string }[]).some((m) => m.key === value);
}

// Lives here (not auth.ts) because it's pure and has to be safe to import
// from Client Components like AdminSidebar — auth.ts pulls in
// @/lib/supabase/server, which depends on next/headers and breaks the
// client bundle the moment anything imports a value from that module.
export function hasModule(
  admin: { roleName: string; modules: ModuleKey[] },
  moduleKey: ModuleKey,
): boolean {
  return admin.roleName === "owner" || admin.modules.includes(moduleKey);
}
