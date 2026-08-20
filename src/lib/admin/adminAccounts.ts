import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/auth";

export class AdminAccountError extends Error {}

export async function listAdminAccounts(): Promise<AdminUser[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, display_name, role")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  }));
}

async function ownerCount(supabase: ReturnType<typeof createServiceRoleClient>): Promise<number> {
  const { count, error } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role", "owner");
  if (error) throw error;
  return count ?? 0;
}

export type CreateAdminAccountInput = {
  email: string;
  displayName: string;
  role: "owner" | "staff";
  password: string;
};

/** No invite-email flow — the owner sets an initial password directly and
 * shares it with the new staff member out of band (WhatsApp, in person),
 * matching how this business already operates day to day. */
export async function createAdminAccount(input: CreateAdminAccountInput): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
  });
  if (userError) throw new AdminAccountError(userError.message);

  const { error: insertError } = await supabase.from("admin_users").insert({
    id: userData.user.id,
    email: input.email,
    display_name: input.displayName,
    role: input.role,
  });
  if (insertError) {
    await supabase.auth.admin.deleteUser(userData.user.id);
    throw insertError;
  }

  return userData.user.id;
}

export async function updateAdminRole(id: string, role: "owner" | "staff"): Promise<void> {
  const supabase = createServiceRoleClient();

  if (role === "staff") {
    const { data: existing, error: fetchError } = await supabase
      .from("admin_users")
      .select("role")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;
    if (existing.role === "owner" && (await ownerCount(supabase)) <= 1) {
      throw new AdminAccountError("Can't demote the last owner — promote someone else first.");
    }
  }

  const { error } = await supabase.from("admin_users").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function removeAdminAccount(id: string, currentAdminId: string): Promise<void> {
  if (id === currentAdminId) {
    throw new AdminAccountError("You can't remove your own admin access.");
  }

  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("admin_users")
    .select("role")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.role === "owner" && (await ownerCount(supabase)) <= 1) {
    throw new AdminAccountError("Can't remove the last owner.");
  }

  // Only revokes portal access (deletes the admin_users row) — the
  // underlying Supabase Auth user is left alone, since they may still
  // have a legitimate reason to hold a login (e.g. also a customer).
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;
}
