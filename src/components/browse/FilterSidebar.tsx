import { EVENT_OPTIONS, type EventCode } from "@/lib/catalog/events";
import type { DietaryTag, Flavor } from "@/lib/types/domain";

const SIZES = ["1", "2", "3", "4", "5"] as const;
const DIETARY_OPTIONS: { tag: DietaryTag; label: string }[] = [
  { tag: "eggless", label: "Eggless" },
  { tag: "gluten_free", label: "Gluten-free" },
  { tag: "vegan", label: "Vegan" },
  { tag: "sugar_free", label: "Sugar-free" },
];

export type FilterValue = {
  flavorSlug: string | null;
  sizeLb: string | null;
  dietary: DietaryTag[];
  event: EventCode | null;
};

export function FilterSidebar({
  flavors,
  value,
  onChange,
  shopPhone,
}: {
  flavors: Flavor[];
  value: FilterValue;
  onChange: (next: FilterValue) => void;
  shopPhone: string;
}) {
  const toggleDietary = (tag: DietaryTag) => {
    const has = value.dietary.includes(tag);
    onChange({
      ...value,
      dietary: has
        ? value.dietary.filter((t) => t !== tag)
        : [...value.dietary, tag],
    });
  };

  return (
    <aside className="flex flex-col gap-6">
      <div>
        <h4 className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Occasion
        </h4>
        <div className="flex flex-col gap-2 font-body text-sm">
          <label className="flex items-center gap-2 text-brand-chocolate">
            <input
              type="radio"
              name="event"
              checked={value.event === null}
              onChange={() => onChange({ ...value, event: null })}
            />
            All occasions
          </label>
          {EVENT_OPTIONS.map(({ code, label }) => (
            <label
              key={code}
              className="flex items-center gap-2 text-brand-chocolate"
            >
              <input
                type="radio"
                name="event"
                checked={value.event === code}
                onChange={() => onChange({ ...value, event: code })}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <hr className="border-brand-chocolate/10" />

      <div>
        <h4 className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Flavor
        </h4>
        <div className="flex flex-col gap-2 font-body text-sm">
          <label className="flex items-center gap-2 text-brand-chocolate">
            <input
              type="radio"
              name="flavor"
              checked={value.flavorSlug === null}
              onChange={() => onChange({ ...value, flavorSlug: null })}
            />
            All flavors
          </label>
          {flavors.map((flavor) => (
            <label
              key={flavor.slug}
              className="flex items-center gap-2 text-brand-chocolate"
            >
              <input
                type="radio"
                name="flavor"
                checked={value.flavorSlug === flavor.slug}
                onChange={() => onChange({ ...value, flavorSlug: flavor.slug })}
              />
              {flavor.name}
            </label>
          ))}
        </div>
      </div>

      <hr className="border-brand-chocolate/10" />

      <div>
        <h4 className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Size, in pounds
        </h4>
        <div className="flex flex-wrap gap-1 rounded-full border-2 border-brand-chocolate/10 bg-white p-1">
          {SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() =>
                onChange({
                  ...value,
                  sizeLb: value.sizeLb === size ? null : size,
                })
              }
              className={`flex-1 rounded-full px-2 py-1 font-body text-sm font-bold ${
                value.sizeLb === size
                  ? "bg-brand-orange text-white"
                  : "text-brand-chocolate hover:bg-brand-chocolate/5"
              }`}
            >
              {size}
            </button>
          ))}
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                sizeLb: value.sizeLb === "other" ? null : "other",
              })
            }
            className={`rounded-full px-2 py-1 font-body text-sm font-bold ${
              value.sizeLb === "other"
                ? "bg-brand-orange text-white"
                : "text-brand-chocolate hover:bg-brand-chocolate/5"
            }`}
          >
            Other
          </button>
        </div>
        {value.sizeLb === "other" && (
          <p className="mt-3 border-l-2 border-brand-orange pl-3 font-body text-xs leading-relaxed text-brand-chocolate/70">
            Cakes can be provided from 1 to 200 pounds. For more than 5
            pounds, call <strong>{shopPhone}</strong> or use the chat button
            on any cake.
          </p>
        )}
      </div>

      <hr className="border-brand-chocolate/10" />

      <div>
        <h4 className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Dietary
        </h4>
        <div className="flex flex-wrap gap-2">
          {DIETARY_OPTIONS.map(({ tag, label }) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleDietary(tag)}
              className={`rounded-full border px-3 py-1 font-body text-xs font-bold ${
                value.dietary.includes(tag)
                  ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                  : "border-brand-chocolate/20 text-brand-chocolate/70 hover:border-brand-chocolate/40"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
