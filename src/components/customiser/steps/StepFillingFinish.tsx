import { RadioOptionGroup } from "@/components/customiser/OptionGroupPicker";
import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

export function StepFillingFinish({
  groupsByCode,
  spec,
  onChange,
}: {
  groupsByCode: Record<string, OptionGroup>;
  spec: DraftOrderSpec;
  onChange: (patch: Partial<DraftOrderSpec>) => void;
}) {
  return (
    <div className="grid gap-8 sm:grid-cols-2">
      {groupsByCode.filling && (
        <RadioOptionGroup
          group={groupsByCode.filling}
          value={spec.filling}
          onChange={(filling) => onChange({ filling })}
        />
      )}
      {groupsByCode.frosting_finish && (
        <RadioOptionGroup
          group={groupsByCode.frosting_finish}
          value={spec.frostingFinish}
          onChange={(frostingFinish) => onChange({ frostingFinish })}
        />
      )}
    </div>
  );
}
