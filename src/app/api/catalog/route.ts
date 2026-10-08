import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import {
  applyCatalogFilters,
  getCachedCakes,
  getCachedDietaryTagOptions,
  getCachedOccasionOptions,
} from "@/lib/catalog/queries";
import { FIXTURE_CAKES, FIXTURE_DIETARY_OPTIONS, FIXTURE_EVENT_OPTIONS } from "@/lib/catalog/fixtures";
import type { CatalogFilters, DietaryTag } from "@/lib/types/domain";

const SORTS: NonNullable<CatalogFilters["sort"]>[] = [
  "price_asc",
  "price_desc",
  "name",
];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sort = params.get("sort");
  const dietary = params.get("dietary");
  const event = params.get("event");

  const [dietaryTagOptions, occasions] = isSupabaseConfigured()
    ? await Promise.all([getCachedDietaryTagOptions(), getCachedOccasionOptions()])
    : [FIXTURE_DIETARY_OPTIONS, FIXTURE_EVENT_OPTIONS];
  const dietaryCodes = new Set(dietaryTagOptions.map((o) => o.code));

  const filters: CatalogFilters = {
    flavorSlug: params.get("flavor") ?? undefined,
    sort: SORTS.find((s) => s === sort),
    dietary: dietary
      ?.split(",")
      .filter((tag): tag is DietaryTag => dietaryCodes.has(tag)),
    event: occasions.find((o) => o.code === event)?.code,
  };

  const cakes = isSupabaseConfigured()
    ? await getCachedCakes(filters)
    : applyCatalogFilters(FIXTURE_CAKES, filters);

  return NextResponse.json({ cakes });
}
