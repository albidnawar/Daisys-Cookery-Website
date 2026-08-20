import Link from "next/link";
import { summarizeSpec } from "@/lib/catalog/specLabels";
import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

export function BasketLineItem({
  cakeName,
  cakeSlug,
  optionGroups,
  spec,
  price,
  draftId,
}: {
  cakeName: string;
  cakeSlug: string | null;
  optionGroups: OptionGroup[];
  spec: DraftOrderSpec;
  price: number;
  draftId: string;
}) {
  const groupsByCode = Object.fromEntries(optionGroups.map((g) => [g.code, g]));
  const sizeLabel = spec.sizeCode ? `${spec.sizeCode} lb` : "";

  return (
    <div className="flex gap-4 border-b border-brand-chocolate/10 pb-4">
      <div className="aspect-4/3 w-36 flex-none rounded-2xl border-2 border-brand-chocolate/10 bg-cream" />
      <div className="flex-1">
        <p className="font-display text-2xl text-brand-chocolate">
          {cakeName} {sizeLabel && `— ${sizeLabel}`}
        </p>
        <p className="mt-1 font-body text-sm leading-relaxed text-brand-chocolate/70">
          {summarizeSpec(groupsByCode, spec)}
        </p>
        {cakeSlug && (
          <Link
            href={`/customise/${cakeSlug}?draft=${draftId}`}
            className="mt-2 inline-block font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
          >
            Modify
          </Link>
        )}
      </div>
      <span className="font-display text-2xl text-brand-chocolate">
        ৳{price.toLocaleString("en-BD")}
      </span>
    </div>
  );
}
