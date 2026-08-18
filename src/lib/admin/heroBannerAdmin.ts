import { createServiceRoleClient } from "@/lib/supabase/server";

export type HeroBannerInput = {
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
};

export async function getHeroBannerForEdit(): Promise<HeroBannerInput> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("hero_banner")
    .select("image_url, link_url, is_active")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { imageUrl: null, linkUrl: null, isActive: true };
  return { imageUrl: data.image_url, linkUrl: data.link_url, isActive: data.is_active };
}

/** There's only ever meant to be one hero banner (see the M9 migration
 * comment) — this updates the existing row if one exists, or creates it
 * on the very first save, rather than exposing list/create/delete like
 * the other admin resources. */
export async function saveHeroBanner(input: HeroBannerInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing } = await supabase.from("hero_banner").select("id").limit(1).maybeSingle();

  const row = {
    image_url: input.imageUrl,
    link_url: input.linkUrl,
    is_active: input.isActive,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { error } = await supabase.from("hero_banner").update(row).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("hero_banner").insert(row);
    if (error) throw error;
  }
}
