export type SortValue = "name" | "price_asc" | "price_desc";

const OPTIONS: { value: SortValue; label: string }[] = [
  { value: "name", label: "Name" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export function SortControl({
  value,
  onChange,
}: {
  value: SortValue;
  onChange: (next: SortValue) => void;
}) {
  return (
    <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
      Sort
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortValue)}
        className="rounded-full border-2 border-brand-chocolate/10 bg-white px-3 py-1.5 font-body text-sm text-brand-chocolate"
      >
        {OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
