import Link from "next/link";
import { BuyingOptionsClient } from "@/components/buying-options/BuyingOptionsClient";
import { getDraftOrder } from "@/lib/draftOrders/store";
import { listZones } from "@/lib/slots/store";

export default async function BuyingOptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const { draft: draftId } = await searchParams;
  const draft = draftId ? await getDraftOrder(draftId) : null;

  if (!draft) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
        <h1 className="mb-4 font-display text-3xl font-semibold text-brand-chocolate">
          Start with a cake first
        </h1>
        <p className="mb-6 font-body text-sm text-brand-chocolate/70">
          Pickup and delivery scheduling happens after you&apos;ve built or
          chosen a cake.
        </p>
        <Link
          href="/browse"
          className="font-body font-bold text-brand-orange hover:text-brand-chocolate"
        >
          Browse the cakes →
        </Link>
      </div>
    );
  }

  const zones = await listZones();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Step 2 of 4
      </span>
      <h1 className="mb-3 mt-2 font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
        How would you like it?
      </h1>
      <p className="mb-10 max-w-2xl font-body text-base leading-relaxed text-brand-chocolate/75">
        Everything is finished on the morning of your slot, so the date you
        pick is the date we bake.
      </p>
      <BuyingOptionsClient draft={draft} zones={zones} />
    </div>
  );
}
