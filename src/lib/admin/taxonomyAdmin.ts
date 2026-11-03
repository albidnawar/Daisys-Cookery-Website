import { createServiceRoleClient } from "@/lib/supabase/server";

export class TaxonomyInUseError extends Error {}

function slugifyCode(label: string): string {
  return label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

// Flavors are no longer managed here — they're a priced option_values
// group (code "sponge"), managed at Order Options, which also doubles as
// the catalog's flavor filter/tag (see listFlavors() in
// src/lib/catalog/queries.ts and 0038_merge_flavors_into_option_values.sql).

// Dietary tags ------------------------------------------------------------

export type DietaryTagOption = { code: string; label: string };

export async function listDietaryTagsAdmin(): Promise<DietaryTagOption[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("dietary_tags").select("code, label").order("sort_order");
  if (error) throw error;
  return data;
}

export async function createDietaryTag(label: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const code = slugifyCode(label);
  const { data: existing } = await supabase
    .from("dietary_tags")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("dietary_tags")
    .insert({ code, label, sort_order: (existing?.sort_order ?? 0) + 1 });
  if (error) {
    if (error.code === "23505") throw new TaxonomyInUseError(`A dietary tag named "${label}" already exists.`);
    throw error;
  }
  return code;
}

export async function updateDietaryTagLabel(code: string, label: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("dietary_tags").update({ label }).eq("code", code);
  if (error) throw error;
}

/** Tags assigned to a cake (cake_dietary_tags.tag) can't be hard-deleted —
 * the admin has to untag every cake using it first. */
export async function deleteDietaryTag(code: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("dietary_tags").delete().eq("code", code);
  if (error) {
    if (error.code === "23503") {
      throw new TaxonomyInUseError(
        "This dietary tag is assigned to one or more cakes. Remove it from those cakes first.",
      );
    }
    throw error;
  }
}

// Occasions ---------------------------------------------------------------

export type OccasionOption = { code: string; label: string };

export async function listOccasionsAdmin(): Promise<OccasionOption[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("occasions").select("code, label").order("sort_order");
  if (error) throw error;
  return data;
}

export async function createOccasion(label: string): Promise<string> {
  const supabase = createServiceRoleClient();
  const code = slugifyCode(label);
  const { data: existing } = await supabase
    .from("occasions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase
    .from("occasions")
    .insert({ code, label, sort_order: (existing?.sort_order ?? 0) + 1 });
  if (error) {
    if (error.code === "23505") throw new TaxonomyInUseError(`An occasion named "${label}" already exists.`);
    throw error;
  }
  return code;
}

export async function updateOccasionLabel(code: string, label: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("occasions").update({ label }).eq("code", code);
  if (error) throw error;
}

/** Occasions assigned to a cake (cake_events.event_code) can't be hard-
 * deleted — the admin has to untag every cake using it first. */
export async function deleteOccasion(code: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("occasions").delete().eq("code", code);
  if (error) {
    if (error.code === "23503") {
      throw new TaxonomyInUseError(
        "This occasion is assigned to one or more cakes. Remove it from those cakes first.",
      );
    }
    throw error;
  }
}
