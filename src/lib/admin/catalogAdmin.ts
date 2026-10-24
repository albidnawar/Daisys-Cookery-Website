import { createServiceRoleClient } from "@/lib/supabase/server";
import type { DietaryTag } from "@/lib/types/domain";
import type { EventCode } from "@/lib/catalog/events";
import { DEFAULT_FOCAL, type FocalPoint } from "@/lib/image/focal";

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
  heroImageFocal: FocalPoint;
  galleryImageUrls: string[];
  // Aligned by index with galleryImageUrls.
  galleryImageFocals: FocalPoint[];
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

/** Aligns a gallery_image_focals jsonb array to the current gallery URL
 * list length — pads with the default (center) focal point for any photo
 * added before this column existed, or if the two ever drift apart. */
function alignGalleryFocals(urls: string[], focals: unknown): FocalPoint[] {
  const list = Array.isArray(focals) ? (focals as Partial<FocalPoint>[]) : [];
  return urls.map((_, i) => {
    const f = list[i];
    return f && typeof f.x === "number" && typeof f.y === "number"
      ? { x: f.x, y: f.y }
      : DEFAULT_FOCAL;
  });
}

export async function getCakeForEdit(id: string): Promise<AdminCakeDetail | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("cakes")
    .select(
      `id, slug, name, description, short_description, base_price, primary_flavor_id,
       hero_image_url, hero_image_focal_x, hero_image_focal_y,
       gallery_image_urls, gallery_image_focals, is_customisable, is_active, availability,
       is_featured_home, featured_sort_order,
       cake_dietary_tags ( tag ), cake_events ( event_code )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const galleryImageUrls: string[] = row.gallery_image_urls ?? [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    shortDescription: row.short_description,
    basePrice: Number(row.base_price),
    primaryFlavorId: row.primary_flavor_id,
    heroImageUrl: row.hero_image_url,
    heroImageFocal: { x: Number(row.hero_image_focal_x), y: Number(row.hero_image_focal_y) },
    galleryImageUrls,
    galleryImageFocals: alignGalleryFocals(galleryImageUrls, row.gallery_image_focals),
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
  heroImageFocal: FocalPoint;
  galleryImageUrls: string[];
  // Aligned by index with galleryImageUrls.
  galleryImageFocals: FocalPoint[];
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
    hero_image_focal_x: input.heroImageFocal?.x ?? DEFAULT_FOCAL.x,
    hero_image_focal_y: input.heroImageFocal?.y ?? DEFAULT_FOCAL.y,
    gallery_image_urls: input.galleryImageUrls,
    gallery_image_focals: input.galleryImageUrls.map(
      (_, i) => input.galleryImageFocals?.[i] ?? DEFAULT_FOCAL,
    ),
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

  // The catalog doesn't yet support picking which option groups apply to
  // which cake despite cake_option_groups' per-cake shape (see
  // supabase/seed.sql) — every customisable cake gets every group, so a
  // newly created one needs the same backfill the seed did once, or its
  // flavor/color/extras pickers (and the admin module that manages their
  // prices) would silently have nothing to show.
  if (input.isCustomisable) {
    const { data: groups, error: groupsError } = await supabase.from("option_groups").select("id");
    if (groupsError) throw groupsError;
    if (groups.length > 0) {
      await supabase
        .from("cake_option_groups")
        .insert(groups.map((g) => ({ cake_id: data.id, option_group_id: g.id })));
    }
  }

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
        "This cake has existing orders and can't be deleted. Hide it instead by turning off \"Visible on the site\".",
      );
    }
    throw error;
  }
}
