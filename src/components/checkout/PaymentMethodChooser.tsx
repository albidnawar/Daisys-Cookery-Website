import type { PaymentMethod } from "@/lib/types/domain";

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card" },
  { value: "cash_on_collection", label: "Cash on collection" },
];

// Placeholders until real numbers are set in .env.local — see
// .env.local.example. No merchant API: customers send money to these
// personal numbers directly and report back the TrxID they get.
const RECEIVING_NUMBERS: Partial<Record<PaymentMethod, string>> = {
  bkash: process.env.NEXT_PUBLIC_BKASH_NUMBER || "01000000000",
  nagad: process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01000000000",
};

export function PaymentMethodChooser({
  value,
  onChange,
  depositAmount,
  manualTrxId,
  onTrxIdChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  depositAmount: number;
  manualTrxId: string;
  onTrxIdChange: (trxId: string) => void;
}) {
  const receivingNumber = RECEIVING_NUMBERS[value];

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

      {receivingNumber && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-brand-chocolate/10 bg-cream p-4">
          <p className="font-body text-sm leading-relaxed text-brand-chocolate/80">
            Send <strong>৳{depositAmount.toLocaleString("en-BD")}</strong> (the deposit) to our{" "}
            {value === "bkash" ? "bKash" : "Nagad"} number{" "}
            <strong>{receivingNumber}</strong> (Send Money), then enter the Transaction ID
            you receive below. We&apos;ll confirm it against our app before your slot is locked in.
          </p>
          <label className="flex flex-col gap-2 font-body text-sm text-brand-chocolate">
            Transaction ID (TrxID)
            <input
              required
              value={manualTrxId}
              onChange={(e) => onTrxIdChange(e.target.value)}
              className="input-field"
              placeholder="e.g. 8N7A6B5C4D"
            />
          </label>
        </div>
      )}

      {value === "card" && (
        <p className="mt-3 font-body text-xs text-brand-chocolate/60">
          Card payment is in test mode — this will simulate a successful payment for now.
        </p>
      )}
    </div>
  );
}
