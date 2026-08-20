import { BrowsePageClient } from "@/components/browse/BrowsePageClient";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { applyCatalogFilters, listCakes, listFlavors } from "@/lib/catalog/queries";
import { FIXTURE_CAKES, FIXTURE_FLAVORS } from "@/lib/catalog/fixtures";
import { EVENT_OPTIONS, type EventCode } from "@/lib/catalog/events";
import { getStoreSettings } from "@/lib/settings/store";
import type { CatalogFilters, DietaryTag } from "@/lib/types/domain";

const EVENT_CODES: EventCode[] = EVENT_OPTIONS.map((o) => o.code);

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const filters: CatalogFilters = {
    flavorSlug: params.flavor,
    dietary: params.dietary?.split(",").filter(Boolean) as
      | DietaryTag[]
      | undefined,
    sort: params.sort as CatalogFilters["sort"],
    event: EVENT_CODES.find((code) => code === params.event),
  };

  const [{ flavors, cakes }, settings] = await Promise.all([
    isSupabaseConfigured()
      ? (async () => {
          const supabase = await createServerSupabaseClient();
          const [flavors, cakes] = await Promise.all([
            listFlavors(supabase),
            listCakes(supabase, filters),
          ]);
          return { flavors, cakes };
        })()
      : Promise.resolve({
          flavors: FIXTURE_FLAVORS,
          cakes: applyCatalogFilters(FIXTURE_CAKES, filters),
        }),
    getStoreSettings(),
  ]);

  return <BrowsePageClient flavors={flavors} initialCakes={cakes} shopPhone={settings.shopPhone} />;
}
