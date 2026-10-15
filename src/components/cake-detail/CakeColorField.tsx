"use client";

const COLOR_PRESETS = [
  "White",
  "Pink",
  "Red",
  "Blue",
  "Purple",
  "Gold",
  "Black",
  "Yellow",
  "Green",
  "Multicolor",
];

/** A free-text color field with quick-pick preset chips underneath —
 * clicking a chip fills the text field with that word, but the field
 * stays freely editable for anything more specific ("Blush pink and
 * gold ombre"). Shared between the admin manual-order form and the
 * public order form so the two never drift apart. */
export function CakeColorField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  return (
    <div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a color, or pick one below"
        className="input-field"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {COLOR_PRESETS.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`rounded-full border-2 px-2.5 py-1 font-body text-xs font-bold ${
              value === color
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            {color}
          </button>
        ))}
      </div>
    </div>
  );
}
