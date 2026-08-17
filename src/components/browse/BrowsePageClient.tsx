"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterSidebar, type FilterValue } from "@/components/browse/FilterSidebar";
import { SortControl, type SortValue } from "@/components/browse/SortControl";
import { CakeCard } from "@/components/browse/CakeCard";
import { EVENT_OPTIONS, type EventCode } from "@/lib/catalog/events";
import type { CakeSummary, Flavor } from "@/lib/types/domain";

const EVENT_CODES: EventCode[] = EVENT_OPTIONS.map((o) => o.code);

function filterFromParams(params: URLSearchParams): FilterValue {
  const event = params.get("event");
  return {
    flavorSlug: params.get("flavor"),
    sizeLb: params.get("size"),
    dietary: (params.get("dietary")?.split(",").filter(Boolean) ?? []) as FilterValue["dietary"],
    event: EVENT_CODES.find((code) => code === event) ?? null,
  };
}

export function BrowsePageClient({
  flavors,
  initialCakes,
}: {
  flavors: Flavor[];
  initialCakes: CakeSummary[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<FilterValue>(() =>
    filterFromParams(searchParams),
  );
  const [sort, setSort] = useState<SortValue>(
    (searchParams.get("sort") as SortValue) ?? "name",
  );
  const [cakes, setCakes] = useState(initialCakes);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.flavorSlug) params.set("flavor", filters.flavorSlug);
    if (filters.dietary.length) params.set("dietary", filters.dietary.join(","));
    if (filters.event) params.set("event", filters.event);
    if (sort !== "name") params.set("sort", sort);

    router.replace(`/browse${params.toString() ? `?${params}` : ""}`, {
      scroll: false,
    });

    startTransition(() => {
      const apiParams = new URLSearchParams(params);
      fetch(`/api/catalog?${apiParams}`)
        .then((res) => res.json())
        .then((data) => setCakes(data.cakes ?? []));
    });
    // filters.sizeLb intentionally excluded: it doesn't affect which cakes
    // are shown (every cake supports 1-5 lb via the customiser), it only
    // informs the ">5lb, call us" note and the customiser's initial size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.flavorSlug, filters.dietary.join(","), filters.event, sort]);

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-8 md:grid-cols-[240px_1fr]">
      <FilterSidebar flavors={flavors} value={filters} onChange={setFilters} />

      <div>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
              All cakes
            </p>
            <h1 className="font-display text-4xl font-semibold text-brand-chocolate">
              The counter
            </h1>
            <p className="mt-2 font-body text-sm text-brand-chocolate/65">
              {cakes.length} cake{cakes.length === 1 ? "" : "s"} &middot; every
              one baked the morning of collection
            </p>
          </div>
          <SortControl value={sort} onChange={setSort} />
        </div>

        <div
          className={`grid gap-6 sm:grid-cols-2 lg:grid-cols-3 ${isPending ? "opacity-60" : ""}`}
        >
          {cakes.map((cake) => (
            <CakeCard key={cake.id} cake={cake} />
          ))}
          {cakes.length === 0 && (
            <p className="col-span-full font-body text-sm text-brand-chocolate/60">
              No cakes match those filters yet — try clearing one, or chat
              with us and we&apos;ll bake it specially.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
