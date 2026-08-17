import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";
import { ReferenceImageDropzone } from "@/components/customiser/ReferenceImageDropzone";
import type { DraftOrderSpec, OptionGroup, PriceBreakdown } from "@/lib/types/domain";

function labelFor(groupsByCode: Record<string, OptionGroup>, code: string, valueCode?: string) {
  if (!valueCode) return "—";
  return (
    groupsByCode[code]?.values.find((v) => v.valueCode === valueCode)?.label ??
    valueCode
  );
}

export function SummaryPanel({
  cakeName,
  draftId,
  spec,
  price,
  groupsByCode,
  onUploaded,
  onInstructionsChange,
}: {
  cakeName: string;
  draftId: string | null;
  spec: DraftOrderSpec;
  price: PriceBreakdown | null;
  groupsByCode: Record<string, OptionGroup>;
  onUploaded: (url: string) => void;
  onInstructionsChange: (value: string) => void;
}) {
  const sizeLabel = spec.sizeCode
    ? labelFor(groupsByCode, "size_lb", spec.sizeCode)
    : "—";
  const extrasLabels = (spec.extras ?? [])
    .map((code) => labelFor(groupsByCode, "extras", code))
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Your cake so far
      </span>

      <ReferenceImageDropzone
        draftId={draftId}
        imageUrl={spec.referenceImageUrl}
        instructions={spec.instructions}
        onUploaded={onUploaded}
        onInstructionsChange={onInstructionsChange}
      />

      <h3 className="font-display text-2xl font-semibold text-brand-chocolate">
        {sizeLabel !== "—" ? `${sizeLabel} ` : ""}
        {cakeName}
      </h3>

      <table className="w-full font-body text-sm">
        <tbody>
          <Row label="Sponge" value={labelFor(groupsByCode, "sponge", spec.sponge)} />
          <Row label="Filling" value={labelFor(groupsByCode, "filling", spec.filling)} />
          <Row
            label="Finish"
            value={labelFor(groupsByCode, "frosting_finish", spec.frostingFinish)}
          />
          <Row label="Message" value={spec.message || "—"} />
          <Row label="Extras" value={extrasLabels || "—"} />
        </tbody>
      </table>

      <div className="flex items-baseline justify-between border-t border-brand-chocolate/10 pt-3">
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Total
        </span>
        <span className="font-display text-3xl font-semibold text-brand-chocolate">
          {price ? `৳${price.total.toLocaleString("en-BD")}` : "Call for a quote"}
        </span>
      </div>

      {draftId ? (
        <LinkButton
          href={`/buying-options?draft=${draftId}`}
          variant="primary"
          className="w-full"
        >
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 text-brand-chocolate/60">{label}</td>
      <td className="py-1 text-right text-brand-chocolate">{value}</td>
    </tr>
  );
}
