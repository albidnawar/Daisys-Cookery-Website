import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { OptionValue } from "@/lib/types/domain";

// The three option groups this admin module manages — Flavor (code
// "sponge", kept from when it also covered filling/frosting) and Cake
// color are single-pick radios, Candles & toppers (code "extras") is a
// multi-pick checkbox group. All three already support a per-choice price
// via option_values.price_delta (see calculatePrice.ts), so this is just
// giving the admin CRUD access to rows that previously only came from
// supabase/seed.sql.
export type OptionGroupCode = "sponge" | "cake_color" | "extras";

export class OptionValueError extends Error {}

function slugifyCode(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

async function getGroupId(
  supabase: ReturnType<typeof createServiceRoleClient>,
  code: OptionGroupCode,
): Promise<string> {
  const { data, error } = await supabase
    .from("option_groups")
    .select("id")
    .eq("code", code)
    .single();
  if (error) throw error;
  return data.id;
}

export async function listOptionValuesAdmin(code: OptionGroupCode): Promise<OptionValue[]> {
  const supabase = createServiceRoleClient();
  const groupId = await getGroupId(supabase, code);
  const { data, error } = await supabase
    .from("option_values")
    .select("id, label, value_code, price_delta, sort_order, metadata")
    .eq("group_id", groupId)
    .order("sort_order");
  if (error) throw error;
  return data.map((v) => ({
    id: v.id,
    label: v.label,
    valueCode: v.value_code,
    priceDelta: Number(v.price_delta),
    metadata: v.metadata,
  }));
}

export async function createOptionValueAdmin(
  code: OptionGroupCode,
  label: string,
  priceDelta: number,
): Promise<string> {
  const supabase = createServiceRoleClient();
  const groupId = await getGroupId(supabase, code);
  const { data: existing } = await supabase
    .from("option_values")
    .select("sort_order")
    .eq("group_id", groupId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("option_values")
    .insert({
      group_id: groupId,
      label,
      value_code: slugifyCode(label) || randomUUID(),
      price_delta: priceDelta,
      sort_order: (existing?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();
  if (error) {
    if (error.code === "23505") throw new OptionValueError(`"${label}" already exists.`);
    throw error;
  }
  return data.id;
}

export async function updateOptionValueAdmin(
  id: string,
  label: string,
  priceDelta: number,
): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("option_values")
    .update({ label, price_delta: priceDelta })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") throw new OptionValueError(`"${label}" already exists.`);
    throw error;
  }
}

/** Nothing else in the schema references an option_values row by id (orders
 * keep their own cake_snapshot JSON copy of whatever was picked at the
 * time), so deleting one is always safe — no FK-in-use guard needed, unlike
 * deleteFlavorAdmin/deleteDietaryTag in taxonomyAdmin.ts. */
export async function deleteOptionValueAdmin(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("option_values").delete().eq("id", id);
  if (error) throw error;
}
