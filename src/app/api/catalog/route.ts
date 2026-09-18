import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { applyCatalogFilters, getCachedCakes } from "@/lib/catalog/queries";
import { FIXTURE_CAKES } from "@/lib/catalog/fixtures";
import { EVENT_OPTIONS, type EventCode } from "@/lib/catalog/events";
import type { CatalogFilters, DietaryTag } from "@/lib/types/domain";

const SORTS: NonNullable<CatalogFilters["sort"]>[] = [
  "price_asc",
  "price_desc",
  "name",
];
const DIETARY_TAGS: DietaryTag[] = [
  "eggless",
  "gluten_free",
  "vegan",
  "sugar_free",
];
const EVENT_CODES: EventCode[] = EVENT_OPTIONS.map((o) => o.code);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const sort = params.get("sort");
  const dietary = params.get("dietary");
  const event = params.get("event");

  const filters: CatalogFilters = {
    flavorSlug: params.get("flavor") ?? undefined,
    sort: SORTS.find((s) => s === sort),
    dietary: dietary
      ?.split(",")
      .filter((tag): tag is DietaryTag =>
        DIETARY_TAGS.includes(tag as DietaryTag),
      ),
    event: EVENT_CODES.find((code) => code === event),
  };

  const cakes = isSupabaseConfigured()
    ? await getCachedCakes(filters)
    : applyCatalogFilters(FIXTURE_CAKES, filters);

  return NextResponse.json({ cakes });
}
