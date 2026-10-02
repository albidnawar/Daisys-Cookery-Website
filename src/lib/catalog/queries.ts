import { unstable_cache } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";
import type { EventCode } from "@/lib/catalog/events";
import { DEFAULT_FOCAL, type FocalPoint } from "@/lib/image/focal";
import type {
  CakeDetail,
  CakeSummary,
  CatalogFilters,
  DietaryTag,
  Flavor,
  OptionGroup,
} from "@/lib/types/domain";

// Untyped on purpose: src/lib/types/database.ts is hand-written pending
// `supabase gen types typescript` against a live project, and its shape
// isn't precise enough for supabase-js's join/select type inference to
// resolve cleanly. Runtime shapes are validated by the Row types below
// instead (see toCakeSummary and the CakeSummaryRow cast in getCakeBySlug).
type Client = SupabaseClient;

const CAKE_SUMMARY_SELECT = `
  id, slug, name, short_description, base_price, hero_image_url,
  hero_image_focal_x, hero_image_focal_y,
  flavor:flavors ( id, name, slug ),
  cake_dietary_tags ( tag ),
  cake_events ( event_code )
`;

type CakeSummaryRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  base_price: number;
  hero_image_url: string | null;
  hero_image_focal_x: number;
  hero_image_focal_y: number;
  flavor: { id: string; name: string; slug: string } | null;
  cake_dietary_tags: { tag: DietaryTag }[];
  cake_events: { event_code: EventCode }[];
};

function toCakeSummary(row: CakeSummaryRow): CakeSummary {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    basePrice: Number(row.base_price),
    heroImageUrl: row.hero_image_url,
    heroImageFocal: { x: Number(row.hero_image_focal_x), y: Number(row.hero_image_focal_y) },
    flavor: row.flavor,
    dietaryTags: row.cake_dietary_tags.map((t) => t.tag),
    events: row.cake_events.map((e) => e.event_code),
  };
}

/** Aligns a gallery_image_focals jsonb array to the gallery URL list
 * length — pads with the default (center) focal point for photos added
 * before this column existed. */
function alignGalleryFocals(urls: string[], focals: unknown): FocalPoint[] {
  const list = Array.isArray(focals) ? (focals as Partial<FocalPoint>[]) : [];
  return urls.map((_, i) => {
    const f = list[i];
    return f && typeof f.x === "number" && typeof f.y === "number"
      ? { x: f.x, y: f.y }
      : DEFAULT_FOCAL;
  });
}

/** Pure in-memory filter/sort, shared by the Supabase-backed fixture
 * fallback (src/app/api/catalog/route.ts) so both data sources behave
 * identically to the Browse UI. */
export function applyCatalogFilters(
  cakes: CakeSummary[],
  filters: CatalogFilters,
): CakeSummary[] {
  let result = cakes;

  if (filters.flavorSlug) {
    result = result.filter((cake) => cake.flavor?.slug === filters.flavorSlug);
  }
  if (filters.dietary?.length) {
    result = result.filter((cake) =>
      filters.dietary!.every((tag) => cake.dietaryTags.includes(tag)),
    );
  }
  if (filters.event) {
    result = result.filter((cake) => cake.events.includes(filters.event!));
  }

  const sorted = [...result];
  switch (filters.sort) {
    case "price_asc":
      sorted.sort((a, b) => a.basePrice - b.basePrice);
      break;
    case "price_desc":
      sorted.sort((a, b) => b.basePrice - a.basePrice);
      break;
    default:
      sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

export async function listFlavors(supabase: Client): Promise<Flavor[]> {
  const { data, error } = await supabase
    .from("flavors")
    .select("id, name, slug")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function listCakes(
  supabase: Client,
  filters: CatalogFilters = {},
): Promise<CakeSummary[]> {
  let query = supabase.from("cakes").select(CAKE_SUMMARY_SELECT).eq("is_active", true);

  if (filters.flavorSlug) {
    const { data: flavor } = await supabase
      .from("flavors")
      .select("id")
      .eq("slug", filters.flavorSlug)
      .maybeSingle();
    query = query.eq("primary_flavor_id", flavor?.id ?? "");
  }

  switch (filters.sort) {
    case "price_asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price_desc":
      query = query.order("base_price", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  const { data, error } = await query.returns<CakeSummaryRow[]>();
  if (error) throw error;

  let cakes = data.map(toCakeSummary);

  if (filters.dietary?.length) {
    cakes = cakes.filter((cake) =>
      filters.dietary!.every((tag) => cake.dietaryTags.includes(tag)),
    );
  }
  if (filters.event) {
    cakes = cakes.filter((cake) => cake.events.includes(filters.event!));
  }

  return cakes;
}

/** Cakes the admin has explicitly picked for the homepage "Shop by flavor"
 * grid (Module 4's homepage placement controls). Falls back to the
 * earliest-added active cakes so the homepage is never empty before an
 * admin has curated anything. */
export async function listFeaturedCakes(
  supabase: Client,
  limit = 4,
): Promise<CakeSummary[]> {
  const { data: featured, error: featuredError } = await supabase
    .from("cakes")
    .select(CAKE_SUMMARY_SELECT)
    .eq("is_active", true)
    .eq("is_featured_home", true)
    .order("featured_sort_order", { ascending: true })
    .limit(limit)
    .returns<CakeSummaryRow[]>();
  if (featuredError) throw featuredError;
  if (featured.length > 0) return featured.map(toCakeSummary);

  const { data, error } = await supabase
    .from("cakes")
    .select(CAKE_SUMMARY_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(limit)
    .returns<CakeSummaryRow[]>();
  if (error) throw error;
  return data.map(toCakeSummary);
}

export async function getCakeBySlug(
  supabase: Client,
  slug: string,
): Promise<CakeDetail | null> {
  const { data: row, error } = await supabase
    .from("cakes")
    .select(
      `
      id, slug, name, description, short_description, base_price,
      hero_image_url, hero_image_focal_x, hero_image_focal_y,
      gallery_image_urls, gallery_image_focals, is_customisable,
      flavor:flavors ( id, name, slug ),
      cake_dietary_tags ( tag ),
      cake_events ( event_code ),
      cake_option_groups (
        option_groups (
          id, code, label, input_type, min_select, max_select,
          option_values ( id, label, value_code, price_delta, sort_order, metadata )
        )
      )
    `,
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) throw error;
  if (!row) return null;

  const r = row as unknown as CakeSummaryRow & {
    description: string;
    gallery_image_urls: string[];
    gallery_image_focals: unknown;
    is_customisable: boolean;
    cake_option_groups: {
      option_groups: {
        id: string;
        code: string;
        label: string;
        input_type: OptionGroup["inputType"];
        min_select: number;
        max_select: number;
        option_values: {
          id: string;
          label: string;
          value_code: string;
          price_delta: number;
          sort_order: number;
          metadata: Record<string, unknown>;
        }[];
      };
    }[];
  };

  const optionGroups: OptionGroup[] = r.cake_option_groups
    .map((link) => link.option_groups)
    .map((group) => ({
      id: group.id,
      code: group.code,
      label: group.label,
      inputType: group.input_type,
      minSelect: group.min_select,
      maxSelect: group.max_select,
      values: [...group.option_values]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((v) => ({
          id: v.id,
          label: v.label,
          valueCode: v.value_code,
          priceDelta: Number(v.price_delta),
          metadata: v.metadata,
        })),
    }));

  return {
    ...toCakeSummary(r),
    description: r.description,
    galleryImageUrls: r.gallery_image_urls,
    galleryImageFocals: alignGalleryFocals(r.gallery_image_urls, r.gallery_image_focals),
    isCustomisable: r.is_customisable,
    optionGroups,
  };
}

// Cached variants of the reads above, for the public-facing hot paths
// (home, browse, cake detail, /api/catalog*) — every table these touch is
// public-read RLS (`for select using (true)`, see 0001_catalog.sql), so
// there's no per-visitor scoping to lose by building a fresh service-role
// client inside the cache instead of accepting one from the caller. A
// request-scoped, cookie-bound client (from createServerSupabaseClient())
// must never be closed over here — unstable_cache's result is shared
// across requests, not just the one that happened to populate it.
//
// Admin routes that write cakes/flavors must call
// revalidateTag("catalog") (see src/app/api/admin/cakes/route.ts and
// src/app/api/admin/cakes/[id]/route.ts) so an edit isn't stuck behind
// the TTL below.
export const getCachedFlavors = unstable_cache(
  () => listFlavors(createServiceRoleClient()),
  ["flavors"],
  { revalidate: 120, tags: ["catalog"] },
);

export const getCachedFeaturedCakes = unstable_cache(
  (limit: number) => listFeaturedCakes(createServiceRoleClient(), limit),
  ["featured-cakes"],
  { revalidate: 60, tags: ["catalog"] },
);

export const getCachedCakes = unstable_cache(
  (filters: CatalogFilters) => listCakes(createServiceRoleClient(), filters),
  ["cakes-list"],
  { revalidate: 60, tags: ["catalog"] },
);

export const getCachedCakeBySlug = unstable_cache(
  (slug: string) => getCakeBySlug(createServiceRoleClient(), slug),
  ["cake-detail"],
  { revalidate: 120, tags: ["catalog"] },
);
