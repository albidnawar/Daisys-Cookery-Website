"use client";

import type { OptionValue } from "@/lib/types/domain";

const COLOR_PRESETS = {
  en: ["White", "Pink", "Red", "Blue", "Purple", "Gold", "Black", "Yellow", "Green", "Multicolor"],
  bn: ["সাদা", "গোলাপি", "লাল", "নীল", "বেগুনি", "সোনালি", "কালো", "হলুদ", "সবুজ", "মাল্টিকালার"],
} as const;

const PLACEHOLDER = {
  en: "Type a color, or pick one below",
  bn: "রঙ লিখুন, অথবা নিচে থেকে বেছে নিন",
} as const;

function formatDelta(delta: number) {
  if (delta <= 0) return "";
  return ` +৳${delta.toLocaleString("en-BD")}`;
}

/** A free-text color field with quick-pick preset chips underneath —
 * clicking a chip fills the text field with its exact label, but the field
 * stays freely editable for anything more specific ("Blush pink and gold
 * ombre"), which carries no extra charge. Shared between the admin
 * manual-order form and the public order form so the two never drift
 * apart.
 *
 * `colorOptions` are the admin-managed, optionally-priced choices from the
 * "Cake color" option group (see /admin/catalog/options) — calculatePrice()
 * applies a chip's price by matching the typed text against its label, so
 * clicking a chip (which fills in that exact text) is what makes the price
 * apply; typing something custom keeps it free. Falls back to a plain,
 * unpriced preset list when the admin hasn't added any colors yet. */
export function CakeColorField({
  value,
  onChange,
  locale = "en",
  colorOptions = [],
}: {
  value: string;
  onChange: (next: string) => void;
  locale?: "en" | "bn";
  colorOptions?: OptionValue[];
}) {
  const chips: { key: string; label: string; priceDelta: number }[] =
    colorOptions.length > 0
      ? colorOptions.map((o) => ({ key: o.id, label: o.label, priceDelta: o.priceDelta }))
      : COLOR_PRESETS[locale].map((label) => ({ key: label, label, priceDelta: 0 }));

  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER[locale]}
        className="input-field"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.label)}
            className={`rounded-full border-2 px-2.5 py-1 font-body text-xs font-bold ${
              value === chip.label
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            {chip.label}
            {formatDelta(chip.priceDelta)}
          </button>
        ))}
      </div>
    </div>
  );
}
