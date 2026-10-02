import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { SavedCake } from "@/lib/types/domain";

export class SavedCakeError extends Error {}

export async function listSavedCakes(customerId: string): Promise<SavedCake[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_cakes")
    .select(
      "id, note, cakes ( id, slug, name, hero_image_url, hero_image_focal_x, hero_image_focal_y )",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (data ?? [])
    .filter((row) => row.cakes)
    .map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cake = row.cakes as any;
      return {
        id: row.id,
        cakeId: cake.id,
        cakeName: cake.name,
        cakeSlug: cake.slug,
        cakeImageUrl: cake.hero_image_url,
        cakeImageFocal: { x: Number(cake.hero_image_focal_x), y: Number(cake.hero_image_focal_y) },
        note: row.note,
      };
    });
}

export async function isCakeSaved(customerId: string, cakeId: string): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("saved_cakes")
    .select("id")
    .eq("customer_id", customerId)
    .eq("cake_id", cakeId)
    .maybeSingle();
  if (error) throw error;
  return data?.id ?? null;
}

export async function saveCake(customerId: string, cakeId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("saved_cakes")
    .insert({ customer_id: customerId, cake_id: cakeId });
  if (error) {
    if (error.code === "23505") throw new SavedCakeError("Already saved");
    throw error;
  }
}

export async function unsaveCake(customerId: string, savedCakeId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("saved_cakes")
    .delete()
    .eq("id", savedCakeId)
    .eq("customer_id", customerId);
  if (error) throw error;
}
