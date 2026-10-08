import { RadioOptionGroup } from "@/components/customiser/OptionGroupPicker";
import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

export function StepSizeShapeTiers({
  groupsByCode,
  spec,
  onChange,
}: {
  groupsByCode: Record<string, OptionGroup>;
  spec: DraftOrderSpec;
  onChange: (patch: Partial<DraftOrderSpec>) => void;
}) {
  const sizeGroup = groupsByCode.size_lb;
  const sizeCodes = sizeGroup?.values.map((v) => v.valueCode) ?? [];
  const isCustomSize = Boolean(spec.sizeCode) && !sizeCodes.includes(spec.sizeCode!);

  return (
    <div className="flex flex-col gap-8">
      {sizeGroup && (
        <div>
          <RadioOptionGroup
            group={sizeGroup}
            // "Other" stays highlighted for any size the group doesn't
            // list (the literal "other" sentinel, or an actual typed
            // weight) — only the number input below ever writes a real
            // weight into spec.sizeCode.
            value={isCustomSize ? "other" : spec.sizeCode}
            onChange={(sizeCode) => onChange({ sizeCode })}
            columns={4}
          />
          {isCustomSize && (
            <div className="mt-3">
              <label className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                Weight, in pounds
              </label>
              <input
                type="number"
                min={0.5}
                step={0.5}
                autoFocus
                placeholder="e.g. 7"
                value={spec.sizeCode === "other" ? "" : spec.sizeCode}
                onChange={(e) => onChange({ sizeCode: e.target.value })}
                className="input-field w-32"
              />
            </div>
          )}
        </div>
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
