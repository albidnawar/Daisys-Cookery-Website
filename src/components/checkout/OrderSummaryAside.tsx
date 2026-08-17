import { Button } from "@/components/ui/Button";
import type { PriceBreakdown } from "@/lib/types/domain";

export function OrderSummaryAside({
  price,
  deliveryFee,
  fulfilmentLabel,
  onSubmit,
  submitting,
  error,
}: {
  price: PriceBreakdown;
  deliveryFee: number;
  fulfilmentLabel: string;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <aside className="flex flex-col gap-3 self-start rounded-2xl border-2 border-brand-chocolate/10 bg-white p-6">
      <h3 className="mb-1 font-display text-xl font-semibold text-brand-chocolate">
        Order summary
      </h3>
      <Row label="Cakes" value={`৳${(price.subtotal + price.extrasTotal).toLocaleString("en-BD")}`} />
      <Row label={fulfilmentLabel} value={deliveryFee ? `৳${deliveryFee.toLocaleString("en-BD")}` : "Free"} />
      <hr className="border-brand-chocolate/10" />
      <div className="flex items-baseline justify-between">
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Total
        </span>
        <span className="font-display text-3xl font-semibold text-brand-chocolate">
          ৳{price.total.toLocaleString("en-BD")}
        </span>
      </div>
      <div className="flex items-baseline justify-between">
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          Deposit due now
        </span>
        <span className="font-display text-2xl font-semibold text-brand-orange">
          ৳{price.depositAmount.toLocaleString("en-BD")}
        </span>
      </div>
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
      <Button
        variant="primary"
        className="mt-2 w-full"
        onClick={onSubmit}
        disabled={submitting}
      >
        {submitting ? "Placing order…" : "Pay deposit & place order"}
      </Button>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between font-body text-sm text-brand-chocolate">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
