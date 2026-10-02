import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { FocalPoint } from "@/lib/image/focal";

type Client = SupabaseClient;

export type HeroBanner = {
  imageUrl: string | null;
  imageFocal: FocalPoint;
  linkUrl: string | null;
};

/** The single active hero banner shown on the homepage, or null if none is
 * configured yet (the UI falls back to a placeholder in that case). */
export async function getActiveHeroBanner(supabase: Client): Promise<HeroBanner | null> {
  const { data, error } = await supabase
    .from("hero_banner")
    .select("image_url, image_focal_x, image_focal_y, link_url")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.image_url) return null;
  return {
    imageUrl: data.image_url,
    imageFocal: { x: Number(data.image_focal_x), y: Number(data.image_focal_y) },
    linkUrl: data.link_url,
  };
}

// Cached for the homepage's hot path — public-read RLS table (0009_hero_banner.sql),
// same reasoning as catalog/queries.ts's cached variants. Admin hero-banner
// writes must call revalidateTag("hero-banner").
export const getCachedActiveHeroBanner = unstable_cache(
  () => getActiveHeroBanner(createServiceRoleClient()),
  ["hero-banner"],
  { revalidate: 120, tags: ["hero-banner"] },
);
