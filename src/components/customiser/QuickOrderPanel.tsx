"use client";

import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { SizeSelector } from "@/components/cake-detail/SizeSelector";
import { toObjectPosition } from "@/lib/image/focal";
import type { CakeDetail, DraftOrderSpec, PriceBreakdown } from "@/lib/types/domain";

/** The "Add to basket" path — buy the cake exactly as listed, at a chosen
 * size, with an optional message. No shape/sponge/filling/frosting/extras
 * are ever set here, so calculatePrice() prices it as basePrice × size with
 * zero extras (see lib/pricing/calculatePrice.ts) — straight to checkout,
 * no options wizard. */
export function QuickOrderPanel({
  cake,
  draftId,
  spec,
  price,
  shopPhone,
  onChange,
}: {
  cake: CakeDetail;
  draftId: string | null;
  spec: DraftOrderSpec;
  price: PriceBreakdown | null;
  shopPhone: string;
  onChange: (patch: Partial<DraftOrderSpec>) => void;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 p-8">
      {cake.heroImageUrl && (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-cream">
          <Image
            src={cake.heroImageUrl}
            alt={cake.name}
            fill
            className="object-cover"
            style={{ objectPosition: toObjectPosition(cake.heroImageFocal) }}
          />
        </div>
      )}

      <h2 className="font-display text-3xl font-semibold text-brand-chocolate">{cake.name}</h2>

      <SizeSelector
        value={spec.sizeCode ?? "1"}
        onChange={(sizeCode) => onChange({ sizeCode })}
        shopPhone={shopPhone}
      />

      <label className="block">
        <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Message on the cake (optional)
        </span>
        <input
          value={spec.message ?? ""}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Happy Birthday, Daisy!"
          className="input-field"
        />
      </label>

      <div className="flex items-baseline justify-between border-t border-brand-chocolate/10 pt-3">
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Total
        </span>
        <span className="font-display text-3xl font-semibold text-brand-chocolate">
          {price ? `৳${price.total.toLocaleString("en-BD")}` : "Call for a quote"}
        </span>
      </div>

      {draftId ? (
        <LinkButton href={`/buying-options?draft=${draftId}`} variant="primary" className="w-full">
          Choose pickup or delivery
        </LinkButton>
      ) : (
        <Link
          href="#"
          className="pointer-events-none w-full rounded-full bg-brand-chocolate/20 px-6 py-3 text-center font-body font-bold text-white"
        >
          Choose pickup or delivery
        </Link>
      )}
    </div>
  );
}
