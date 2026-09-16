import { createServiceRoleClient } from "@/lib/supabase/server";
import { MODULES, type ModuleKey } from "@/lib/admin/modules";

export type AdminRole = {
  id: string;
  name: string;
  isSystem: boolean;
  modules: ModuleKey[];
};

export class AdminRoleError extends Error {}

const RESERVED_NAMES = new Set(["owner", "marketing", "sales"]);
const VALID_MODULES = new Set<string>(MODULES.map((m) => m.key));

export async function listAdminRoles(): Promise<AdminRole[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_roles")
    .select("id, name, is_system, modules")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isSystem: row.is_system,
    modules: row.modules as ModuleKey[],
  }));
}

function cleanModules(modules: string[]): ModuleKey[] {
  const unique = [...new Set(modules)].filter((m): m is ModuleKey => VALID_MODULES.has(m));
  if (unique.length === 0) throw new AdminRoleError("Pick at least one module for this role.");
  return unique;
}

/** 23505 is Postgres' unique_violation code — surfaced here as a friendly
 * message rather than a raw constraint-name error, since admin_roles.name
 * is the only unique constraint any of these writes can hit. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: string }).code === "23505";
}

export async function createCustomRole(name: string, modules: string[]): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) throw new AdminRoleError("Give the role a name.");
  if (RESERVED_NAMES.has(trimmed.toLowerCase())) {
    throw new AdminRoleError("That name is reserved for a built-in role.");
  }
  const clean = cleanModules(modules);

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("admin_roles")
    .insert({ name: trimmed, is_system: false, modules: clean })
    .select("id")
    .single();
  if (error) {
    if (isUniqueViolation(error)) throw new AdminRoleError("A role with that name already exists.");
    throw error;
  }
  return data.id;
}

export async function updateCustomRole(id: string, name: string, modules: string[]): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("admin_roles")
    .select("is_system")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.is_system) throw new AdminRoleError("Built-in roles can't be edited.");

  const trimmed = name.trim();
  if (!trimmed) throw new AdminRoleError("Give the role a name.");
  if (RESERVED_NAMES.has(trimmed.toLowerCase())) {
    throw new AdminRoleError("That name is reserved for a built-in role.");
  }
  const clean = cleanModules(modules);

  const { error } = await supabase
    .from("admin_roles")
    .update({ name: trimmed, modules: clean })
    .eq("id", id);
  if (error) {
    if (isUniqueViolation(error)) throw new AdminRoleError("A role with that name already exists.");
    throw error;
  }
}

export async function deleteCustomRole(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("admin_roles")
    .select("is_system")
    .eq("id", id)
    .single();
  if (fetchError) throw fetchError;
  if (existing.is_system) throw new AdminRoleError("Built-in roles can't be deleted.");

  const { count, error: countError } = await supabase
    .from("admin_users")
    .select("id", { count: "exact", head: true })
    .eq("role_id", id);
  if (countError) throw countError;
  if ((count ?? 0) > 0) {
    throw new AdminRoleError("Reassign the admins using this role before deleting it.");
  }

  const { error } = await supabase.from("admin_roles").delete().eq("id", id);
  if (error) throw error;
}
