import type { PaymentMethod } from "@/lib/types/domain";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card" },
  { value: "cash_on_collection", label: "Cash on collection" },
];

export function PaymentMethodChooser({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <div>
      <h3 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
        Payment
      </h3>
      <div className="flex flex-wrap gap-2">
        {METHODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={`rounded-full border-2 px-4 py-2 font-body text-sm font-bold ${
              value === m.value
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {value !== "cash_on_collection" && (
        <p className="mt-3 font-body text-xs text-brand-chocolate/60">
          Payment integration is in test mode — this will simulate a
          successful payment for now.
        </p>
      )}
    </div>
  );
}
