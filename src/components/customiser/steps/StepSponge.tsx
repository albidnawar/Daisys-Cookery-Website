import { RadioOptionGroup } from "@/components/customiser/OptionGroupPicker";
import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

export function StepSponge({
  groupsByCode,
  spec,
  onChange,
}: {
  groupsByCode: Record<string, OptionGroup>;
  spec: DraftOrderSpec;
  onChange: (patch: Partial<DraftOrderSpec>) => void;
}) {
  if (!groupsByCode.sponge) return null;
  return (
    <RadioOptionGroup
      group={groupsByCode.sponge}
      value={spec.sponge}
      onChange={(sponge) => onChange({ sponge })}
      columns={4}
    />
  );
}
