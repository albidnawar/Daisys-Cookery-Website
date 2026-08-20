import { createServerSupabaseClient } from "@/lib/supabase/server";

export type AdminUser = {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "staff";
};

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
    .select("id, email, display_name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
  };
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

/** Store Settings' financial numbers and Admin Accounts (who else can log
 * in) are gated to owners only — any staff account being able to add/
 * remove other admins or change the deposit rate would be a real gap, not
 * just a nice-to-have restriction. */
export async function requireOwner(): Promise<AdminUser> {
  const admin = await requireAdmin();
  if (admin.role !== "owner") throw new AdminAuthError();
  return admin;
}
