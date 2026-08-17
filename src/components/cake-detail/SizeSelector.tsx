const SIZES = ["1", "2", "3", "4", "5"] as const;

export function SizeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
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
            value === "other"
              ? "bg-brand-orange text-white"
              : "text-brand-chocolate hover:bg-brand-chocolate/5"
          }`}
        >
          Other
        </button>
      </div>
      {value === "other" && (
        <p className="mt-3 border-l-2 border-brand-orange pl-3 font-body text-xs leading-relaxed text-brand-chocolate/70">
          Cakes over five pounds are quoted by phone — call{" "}
          <strong>01814438989</strong>, or use the chat button below.
        </p>
      )}
    </div>
  );
}
