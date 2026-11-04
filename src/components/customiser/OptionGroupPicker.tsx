import type { OptionGroup } from "@/lib/types/domain";

function formatDelta(delta: number) {
  if (delta === 0) return "";
  return ` +৳${delta.toLocaleString("en-BD")}`;
}

export function RadioOptionGroup({
  group,
  value,
  onChange,
  columns = 1,
}: {
  group: OptionGroup;
  value: string | undefined;
  onChange: (valueCode: string) => void;
  columns?: 1 | 2 | 4;
}) {
  const colClass = columns === 4 ? "grid-cols-2 sm:grid-cols-4" : columns === 2 ? "grid-cols-2" : "grid-cols-1";
  return (
    <div>
      <h4 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">
        {group.label}
      </h4>
      <div className={`grid gap-2 ${colClass}`}>
        {group.values.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.valueCode)}
            className={`rounded-full border-2 px-4 py-2 text-left font-body text-sm font-bold ${
              value === v.valueCode
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            {v.label}
            {formatDelta(v.priceDelta)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CheckboxOptionGroup({
  group,
  value,
  onChange,
  columns,
}: {
  group: OptionGroup;
  value: string[];
  onChange: (valueCodes: string[]) => void;
  columns?: 1 | 2 | 4;
}) {
  const toggle = (code: string) => {
    onChange(
      value.includes(code) ? value.filter((c) => c !== code) : [...value, code],
    );
  };

  const colClass =
    columns === 4
      ? "grid grid-cols-2 sm:grid-cols-4"
      : columns === 2
        ? "grid grid-cols-2"
        : "flex flex-wrap";

  return (
    <div>
      <h4 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">
        {group.label}
      </h4>
      <div className={`gap-2 ${colClass}`}>
        {group.values.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => toggle(v.valueCode)}
            className={`rounded-full border-2 px-4 py-2 font-body text-sm font-bold ${
              value.includes(v.valueCode)
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            {v.label}
            {formatDelta(v.priceDelta)}
          </button>
        ))}
      </div>
    </div>
  );
}
