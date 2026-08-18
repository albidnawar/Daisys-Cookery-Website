import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

export type HeroBanner = {
  imageUrl: string | null;
  linkUrl: string | null;
};

/** The single active hero banner shown on the homepage, or null if none is
 * configured yet (the UI falls back to a placeholder in that case). */
export async function getActiveHeroBanner(supabase: Client): Promise<HeroBanner | null> {
  const { data, error } = await supabase
    .from("hero_banner")
    .select("image_url, link_url")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.image_url) return null;
  return { imageUrl: data.image_url, linkUrl: data.link_url };
}
