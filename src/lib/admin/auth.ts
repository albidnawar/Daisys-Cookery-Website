import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hasModule, MODULES, MODULE_ROUTES, type ModuleKey } from "@/lib/admin/modules";

// Re-exported so existing server-side call sites (`import { hasModule }
// from "@/lib/admin/auth"`) keep working — Client Components should
// import it from "@/lib/admin/modules" directly instead, since importing
// anything else from this file drags in the next/headers-dependent
// Supabase server client.
export { hasModule };

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  roleId: string;
  roleName: string;
  modules: ModuleKey[];
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AdminRow = any;

function rowToAdmin(data: AdminRow): AdminUser | null {
  const role = data.admin_roles as { name: string; modules: string[] } | null;
  if (!role) return null;
  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    roleId: data.role_id,
    roleName: role.name,
    modules: role.modules as ModuleKey[],
  };
}

/** Server Components / route handlers: returns the logged-in admin, or
 * null if there's no session or the session isn't an admin_users row. A
 * Supabase Auth session alone is not enough — see the migration comment. */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("admin_users")
    .select("id, email, display_name, role_id, admin_roles ( name, modules )")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return rowToAdmin(data);
}

/** Route handlers only: throws a plain Error (caught by the route's own
 * try/catch, or surfaced as a 500 — routes below use it inside a guard
 * that returns 401/403 explicitly) if the caller isn't an admin. */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new AdminAuthError();
  return admin;
}

export class AdminAuthError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/** Store Settings' financial numbers, Admin Accounts, and Roles & Permissions
 * are gated to owners only — hardcoded by role name, never delegable
 * through the module system, since letting any role touch billing config
 * or other admins' access would be a real gap, not just a nice-to-have
 * restriction. */
export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.roleName !== "owner") throw new AdminAuthError();
  return admin;
}

/** Route handlers whose module maps 1:1 to a nav section (e.g. all four
 * Content & Media pages gate on "content_media"). Throws the same
 * AdminAuthError as requireAdmin/requireOwner so existing catch blocks
 * that map it to a 401/403 need no other change. */
export async function requireModule(moduleKey: ModuleKey): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (!hasModule(admin, moduleKey)) throw new AdminAuthError();
  return admin;
}

/** The first admin page a given admin can actually open — used both to
 * bounce an admin who lacks a module they tried to open directly by URL,
 * and (implicitly, via that same redirect from "/admin") to route a
 * restricted role like Marketing straight to their own landing page. */
export function firstAccessiblePath(admin: AdminUser): string {
  if (admin.roleName === "owner") return "/admin";
  const found = MODULES.find((m) => admin.modules.includes(m.key));
  return found ? MODULE_ROUTES[found.key] : "/admin/settings";
}

/** Server Component pages: like requireModule, but redirects instead of
 * throwing, since a page render has no try/catch to turn that into a JSON
 * 401/403 response. */
export async function requireModulePage(moduleKey: ModuleKey): Promise<AdminUser> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  if (!hasModule(admin, moduleKey)) redirect(firstAccessiblePath(admin));
  return admin;
}
