"use client";

import { useState } from "react";
import type { OptionValue } from "@/lib/types/domain";

const COLOR_PRESETS = {
  en: ["White", "Pink", "Red", "Blue", "Purple", "Gold", "Black", "Yellow", "Green", "Multicolor"],
  bn: ["সাদা", "গোলাপি", "লাল", "নীল", "বেগুনি", "সোনালি", "কালো", "হলুদ", "সবুজ", "মাল্টিকালার"],
} as const;

const COPY = {
  en: { customPlaceholder: "Add another color", add: "Add" },
  bn: { customPlaceholder: "আরেকটি রঙ যোগ করুন", add: "যোগ করুন" },
} as const;

/** A multi-select color picker — click any number of preset/admin-managed
 * chips, plus type in anything more specific not on the list ("Blush pink
 * and gold ombre"). Color never affects price (see calculatePrice.ts), so
 * there's no price badge here, unlike the single-select option groups
 * elsewhere in the Customiser. Shared between the admin manual-order form
 * and the public order form so the two never drift apart.
 *
 * `colorOptions` are the admin-managed choices from the "Cake color" option
 * group (see /admin/catalog/options) — falls back to a plain preset list
 * when the admin hasn't added any colors yet. */
export function CakeColorField({
  value,
  onChange,
  locale = "en",
  colorOptions = [],
}: {
  value: string[];
  onChange: (next: string[]) => void;
  locale?: "en" | "bn";
  colorOptions?: OptionValue[];
}) {
  const t = COPY[locale];
  const [customText, setCustomText] = useState("");

  const presets: string[] =
    colorOptions.length > 0 ? colorOptions.map((o) => o.label) : [...COLOR_PRESETS[locale]];
  const customSelected = value.filter((v) => !presets.includes(v));

  const toggle = (label: string) => {
    onChange(value.includes(label) ? value.filter((v) => v !== label) : [...value, label]);
  };

  const addCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setCustomText("");
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            className={`rounded-full border-2 px-2.5 py-1 font-body text-xs font-bold ${
              value.includes(label)
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            {label}
          </button>
        ))}
        {customSelected.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => toggle(label)}
            className="rounded-full border-2 border-brand-orange bg-brand-orange/10 px-2.5 py-1 font-body text-xs font-bold text-brand-orange"
          >
            {label} ×
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
          placeholder={t.customPlaceholder}
          className="input-field flex-1"
        />
        <button
          type="button"
          onClick={addCustom}
          className="rounded-full border-2 border-brand-chocolate/10 bg-white px-3 py-1.5 font-body text-xs font-bold text-brand-chocolate hover:border-brand-chocolate/25"
        >
          {t.add}
        </button>
      </div>
    </div>
  );
}
