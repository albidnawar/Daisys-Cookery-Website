import { RadioOptionGroup } from "@/components/customiser/OptionGroupPicker";
import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

export function StepSizeShapeTiers({
  groupsByCode,
  spec,
  onChange,
  shopPhone,
}: {
  groupsByCode: Record<string, OptionGroup>;
  spec: DraftOrderSpec;
  onChange: (patch: Partial<DraftOrderSpec>) => void;
  shopPhone: string;
}) {
  return (
    <div className="flex flex-col gap-8">
      {groupsByCode.size_lb && (
        <RadioOptionGroup
          group={groupsByCode.size_lb}
          value={spec.sizeCode}
          onChange={(sizeCode) => onChange({ sizeCode })}
          columns={4}
        />
      )}
      {spec.sizeCode === "other" && (
        <p className="border-l-2 border-brand-orange pl-3 font-body text-sm leading-relaxed text-brand-chocolate/70">
          Cakes can be provided from 1 to 200 pounds. For more than 5
          pounds, call <strong>{shopPhone}</strong> — or use the chat
          button to send us the details.
        </p>
      )}
      <div className="grid gap-8 sm:grid-cols-2">
        {groupsByCode.shape && (
          <RadioOptionGroup
            group={groupsByCode.shape}
            value={spec.shape}
            onChange={(shape) => onChange({ shape })}
          />
        )}
        {groupsByCode.tiers && (
          <RadioOptionGroup
            group={groupsByCode.tiers}
            value={spec.tiers}
            onChange={(tiers) => onChange({ tiers })}
          />
        )}
      </div>
    </div>
  );
}
