import { createServiceRoleClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/auth";
import type { ModuleKey } from "@/lib/admin/modules";

export class AdminAccountError extends Error {}

export async function listAdminAccounts(): Promise<AdminUser[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, display_name, role_id, admin_roles ( name, modules )")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => {
    const role = row.admin_roles as unknown as { name: string; modules: string[] };
    return {
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      roleId: row.role_id,
      roleName: role.name,
      modules: role.modules as ModuleKey[],
    };
  });
}

async function ownerRoleId(supabase: ReturnType<typeof createServiceRoleClient>): Promise<string> {
  const { data, error } = await supabase.from("admin_roles").select("id").eq("name", "owner").single();
  if (error) throw error;
  return data.id;
}

async function ownerCount(
  supabase: ReturnType<typeof createServiceRoleClient>,
  ownerRoleIdValue: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role_id", ownerRoleIdValue);
  if (error) throw error;
  return count ?? 0;
}

export type CreateAdminAccountInput = {
  email: string;
  displayName: string;
  roleId: string;
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
    role_id: input.roleId,
  });
  if (insertError) {
    await supabase.auth.admin.deleteUser(userData.user.id);
    throw insertError;
  }

  return userData.user.id;
}

export async function updateAdminRole(id: string, roleId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const owner = await ownerRoleId(supabase);

  const { data: existing, error: fetchError } = await supabase
    .from("admin_users")
    .select("role_id")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;

  if (existing.role_id === owner && roleId !== owner && (await ownerCount(supabase, owner)) <= 1) {
    throw new AdminAccountError("Can't demote the last owner — promote someone else first.");
  }

  const { error } = await supabase.from("admin_users").update({ role_id: roleId }).eq("id", id);
  if (error) throw error;
}

export async function removeAdminAccount(id: string, currentAdminId: string): Promise<void> {
  if (id === currentAdminId) {
    throw new AdminAccountError("You can't remove your own admin access.");
  }

  const supabase = createServiceRoleClient();
  const owner = await ownerRoleId(supabase);
  const { data: existing, error: fetchError } = await supabase
    .from("admin_users")
    .select("role_id")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.role_id === owner && (await ownerCount(supabase, owner)) <= 1) {
    throw new AdminAccountError("Can't remove the last owner.");
  }

  // Only revokes portal access (deletes the admin_users row) — the
  // underlying Supabase Auth user is left alone, since they may still
  // have a legitimate reason to hold a login (e.g. also a customer).
  const { error } = await supabase.from("admin_users").delete().eq("id", id);
  if (error) throw error;
}
