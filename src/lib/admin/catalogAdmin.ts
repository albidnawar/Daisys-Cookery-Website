import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DietaryTag } from "@/lib/types/domain";
import type { EventCode } from "@/lib/catalog/events";

export type AdminCakeSummary = {
  id: string;
  slug: string;
  name: string;
  basePrice: number;
  flavorName: string | null;
  isActive: boolean;
  availability: string;
  isFeaturedHome: boolean;
};

export type AdminCakeDetail = {
  id: string;
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  primaryFlavorId: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  isCustomisable: boolean;
  isActive: boolean;
  availability: "in_stock" | "sold_out" | "pre_order";
  isFeaturedHome: boolean;
  featuredSortOrder: number;
  dietaryTags: DietaryTag[];
  events: EventCode[];
};

export async function listAllCakesAdmin(): Promise<AdminCakeSummary[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("cakes")
    .select(
      "id, slug, name, base_price, is_active, availability, is_featured_home, flavor:flavors ( name )",
    )
    .order("name");
  if (error) throw error;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    basePrice: Number(row.base_price),
    flavorName: row.flavor?.name ?? null,
    isActive: row.is_active,
    availability: row.availability,
    isFeaturedHome: row.is_featured_home,
  }));
}

export async function getCakeForEdit(id: string): Promise<AdminCakeDetail | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("cakes")
    .select(
      `id, slug, name, description, short_description, base_price, primary_flavor_id,
       hero_image_url, gallery_image_urls, is_customisable, is_active, availability,
       is_featured_home, featured_sort_order,
       cake_dietary_tags ( tag ), cake_events ( event_code )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description,
    basePrice: Number(row.base_price),
    primaryFlavorId: row.primary_flavor_id,
    heroImageUrl: row.hero_image_url,
    galleryImageUrls: row.gallery_image_urls ?? [],
    isCustomisable: row.is_customisable,
    isActive: row.is_active,
    availability: row.availability,
    isFeaturedHome: row.is_featured_home,
    featuredSortOrder: row.featured_sort_order,
    dietaryTags: row.cake_dietary_tags.map((t: { tag: DietaryTag }) => t.tag),
    events: row.cake_events.map((e: { event_code: EventCode }) => e.event_code),
  };
}

export type CakeInput = {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  basePrice: number;
  primaryFlavorId: string | null;
  heroImageUrl: string | null;
  galleryImageUrls: string[];
  isCustomisable: boolean;
  isActive: boolean;
  availability: "in_stock" | "sold_out" | "pre_order";
  isFeaturedHome: boolean;
  featuredSortOrder: number;
  dietaryTags: DietaryTag[];
  events: EventCode[];
};

function toRow(input: CakeInput) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    short_description: input.shortDescription,
    base_price: input.basePrice,
    primary_flavor_id: input.primaryFlavorId,
    hero_image_url: input.heroImageUrl,
    gallery_image_urls: input.galleryImageUrls,
    is_customisable: input.isCustomisable,
    is_active: input.isActive,
    availability: input.availability,
    is_featured_home: input.isFeaturedHome,
    featured_sort_order: input.featuredSortOrder,
  };
}

async function syncTags(cakeId: string, dietaryTags: DietaryTag[], events: EventCode[]) {
  const supabase = createServiceRoleClient();
  await supabase.from("cake_dietary_tags").delete().eq("cake_id", cakeId);
  if (dietaryTags.length) {
    await supabase
      .from("cake_dietary_tags")
      .insert(dietaryTags.map((tag) => ({ cake_id: cakeId, tag })));
  }
  await supabase.from("cake_events").delete().eq("cake_id", cakeId);
  if (events.length) {
    await supabase
      .from("cake_events")
      .insert(events.map((event_code) => ({ cake_id: cakeId, event_code })));
  }
}

export async function createCake(input: CakeInput): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("cakes")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error) throw error;
  await syncTags(data.id, input.dietaryTags, input.events);
  return data.id;
}

export async function updateCake(id: string, input: CakeInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("cakes").update(toRow(input)).eq("id", id);
  if (error) throw error;
  await syncTags(id, input.dietaryTags, input.events);
}

export class CakeInUseError extends Error {}

/** Cakes that have ever been ordered can't be hard-deleted — draft_orders,
 * orders, and order_items all reference the row, and deleting it would
 * corrupt historical order records. Catch the FK violation and surface a
 * clear message instead; the admin should hide the cake (is_active=false)
 * via the edit form in that case. */
export async function deleteCake(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("cakes").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new CakeInUseError(
        "This cake has existing orders and can't be deleted — hide it instead by turning off \"Visible on the site\".",
      );
    }
    throw error;
  }
}
