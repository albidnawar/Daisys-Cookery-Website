import Link from "next/link";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { getDraftOrder, resolveCake } from "@/lib/draftOrders/store";
import { listZones } from "@/lib/slots/store";
import { calculatePrice, withDeliveryFee } from "@/lib/pricing/calculatePrice";

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft: draftId } = await searchParams;
  const draft = draftId ? await getDraftOrder(draftId) : null;

  if (!draft || !draft.cakeSlug || !draft.fulfilmentType || !draft.zoneId || !draft.slotId) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
        <h1 className="mb-4 font-display text-3xl font-semibold text-brand-chocolate">
          Not quite ready to check out
        </h1>
        <p className="mb-6 font-body text-sm text-brand-chocolate/70">
          Pick a pickup or delivery slot first, then come back here.
        </p>
        <Link
          href={draftId ? `/buying-options?draft=${draftId}` : "/browse"}
          className="font-body font-bold text-brand-orange hover:text-brand-chocolate"
        >
          {draftId ? "Choose pickup or delivery →" : "Browse the cakes →"}
        </Link>
      </div>
    );
  }

  const cake = await resolveCake(draft.cakeSlug);
  const cakePrice = cake ? calculatePrice(cake, draft.spec) : null;
  const zones = await listZones();
  const zone = zones.find((z) => z.id === draft.zoneId);

  if (!cake || !cakePrice || !zone) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
          Something&apos;s missing from this order
        </h1>
        <p className="mt-4 font-body text-sm text-brand-chocolate/70">
          Please start again from the cake you were customising.
        </p>
      </div>
    );
  }

  const deliveryFee = draft.fulfilmentType === "delivery" ? zone.deliveryFee : 0;
  const price = withDeliveryFee(cakePrice, deliveryFee);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Step 3 of 4
      </span>
      <h1 className="mb-10 mt-2 font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
        Your basket
      </h1>
      <CheckoutClient
        draft={draft}
        cake={cake}
        price={price}
        fulfilmentLabel={
          draft.fulfilmentType === "pickup" ? `Collection — ${zone.name}` : `Delivery — ${zone.name}`
        }
      />
    </div>
  );
}
