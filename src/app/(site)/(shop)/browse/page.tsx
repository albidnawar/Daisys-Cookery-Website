import { BrowsePageClient } from "@/components/browse/BrowsePageClient";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import {
  applyCatalogFilters,
  getCachedCakes,
  getCachedDietaryTagOptions,
  getCachedFlavors,
  getCachedOccasionOptions,
  type TaxonomyOption,
} from "@/lib/catalog/queries";
import {
  FIXTURE_CAKES,
  FIXTURE_DIETARY_OPTIONS,
  FIXTURE_EVENT_OPTIONS,
  FIXTURE_FLAVORS,
} from "@/lib/catalog/fixtures";
import type { CatalogFilters, DietaryTag } from "@/lib/types/domain";

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;

  const { flavors, occasions, dietaryTagOptions, cakes } = await (isSupabaseConfigured()
    ? (async () => {
        const [flavors, occasions, dietaryTagOptions] = await Promise.all([
          getCachedFlavors(),
          getCachedOccasionOptions(),
          getCachedDietaryTagOptions(),
        ]);
        const filters: CatalogFilters = {
          flavorSlug: params.flavor,
          dietary: params.dietary?.split(",").filter(Boolean) as DietaryTag[] | undefined,
          sort: params.sort as CatalogFilters["sort"],
          event: occasions.find((o) => o.code === params.event)?.code,
        };
        const cakes = await getCachedCakes(filters);
        return { flavors, occasions, dietaryTagOptions, cakes };
      })()
    : (() => {
        const filters: CatalogFilters = {
          flavorSlug: params.flavor,
          dietary: params.dietary?.split(",").filter(Boolean) as DietaryTag[] | undefined,
          sort: params.sort as CatalogFilters["sort"],
          event: FIXTURE_EVENT_OPTIONS.find((o) => o.code === params.event)?.code,
        };
        return Promise.resolve({
          flavors: FIXTURE_FLAVORS,
          occasions: FIXTURE_EVENT_OPTIONS as TaxonomyOption[],
          dietaryTagOptions: FIXTURE_DIETARY_OPTIONS as TaxonomyOption[],
          cakes: applyCatalogFilters(FIXTURE_CAKES, filters),
        });
      })());

  return (
    <BrowsePageClient
      flavors={flavors}
      occasions={occasions}
      dietaryTagOptions={dietaryTagOptions}
      initialCakes={cakes}
    />
  );
}
