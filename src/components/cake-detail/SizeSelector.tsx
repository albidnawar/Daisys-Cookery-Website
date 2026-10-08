const SIZES = ["1", "2", "3", "4", "5"] as const;

export function SizeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const isCustom = value !== "" && !(SIZES as readonly string[]).includes(value);

  return (
    <div>
      <h4 className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        Size
      </h4>
      <div className="flex flex-wrap gap-1 rounded-full border-2 border-brand-chocolate/10 bg-white p-1">
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => onChange(size)}
            className={`flex-1 rounded-full px-3 py-1.5 font-body text-sm font-bold ${
              value === size
                ? "bg-brand-orange text-white"
                : "text-brand-chocolate hover:bg-brand-chocolate/5"
            }`}
          >
            {size} lb
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("other")}
          className={`rounded-full px-3 py-1.5 font-body text-sm font-bold ${
            isCustom
              ? "bg-brand-orange text-white"
              : "text-brand-chocolate hover:bg-brand-chocolate/5"
          }`}
        >
          Other
        </button>
      </div>
      {isCustom && (
        <div className="mt-3">
          <label className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Weight, in pounds
          </label>
          <input
            type="number"
            min={0.5}
            step={0.5}
            autoFocus
            placeholder="e.g. 7"
            value={value === "other" ? "" : value}
            onChange={(e) => onChange(e.target.value)}
            className="input-field w-32"
          />
        </div>
      )}
    </div>
  );
}
