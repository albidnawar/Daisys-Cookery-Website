import { LinkButton } from "@/components/ui/Button";
import type { PriceBreakdown } from "@/lib/types/domain";

export function DepositSummary({
  price,
  draftId,
  canContinue,
  depositRate,
}: {
  price: PriceBreakdown | null;
  draftId: string;
  canContinue: boolean;
  depositRate: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="font-body text-sm leading-relaxed text-brand-chocolate/75">
        A {Math.round(depositRate * 100)}% deposit holds your date and pays for the ingredients we
        buy in for you. The balance is due at collection or on delivery.
      </p>
      <div className="flex items-baseline justify-between border-t border-brand-chocolate/10 pt-3">
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Due now
        </span>
        <span className="font-display text-3xl font-semibold text-brand-orange">
          {price ? `৳${price.depositAmount.toLocaleString("en-BD")}` : "—"}
        </span>
      </div>
      {price && (
        <p className="font-body text-xs text-brand-chocolate/60">
          Total ৳{price.total.toLocaleString("en-BD")} &middot; balance ৳
          {price.balanceDue.toLocaleString("en-BD")} due later.
        </p>
      )}
      <LinkButton
        href={`/checkout?draft=${draftId}`}
        variant="primary"
        className={`w-full ${canContinue ? "" : "pointer-events-none opacity-40"}`}
      >
        Continue to basket
      </LinkButton>
    </div>
  );
}
