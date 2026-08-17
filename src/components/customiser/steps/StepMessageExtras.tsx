import { CheckboxOptionGroup } from "@/components/customiser/OptionGroupPicker";
import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

const MESSAGE_MAX = 30;

export function StepMessageExtras({
  groupsByCode,
  spec,
  onChange,
  hasReferenceImage,
}: {
  groupsByCode: Record<string, OptionGroup>;
  spec: DraftOrderSpec;
  onChange: (patch: Partial<DraftOrderSpec>) => void;
  hasReferenceImage: boolean;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h4 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">
          Written message
        </h4>
        <input
          type="text"
          value={spec.message ?? ""}
          maxLength={MESSAGE_MAX}
          onChange={(e) => onChange({ message: e.target.value })}
          placeholder="Happy Birthday, Nabila"
          className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-4 py-3 font-display text-lg text-brand-chocolate outline-none focus:border-brand-orange"
        />
        <p className="mt-2 font-body text-xs text-brand-chocolate/60">
          Piped by hand &middot; up to {MESSAGE_MAX} characters &middot;{" "}
          {(spec.message ?? "").length}/{MESSAGE_MAX} &middot; included
        </p>
      </div>

      {groupsByCode.extras && (
        <CheckboxOptionGroup
          group={groupsByCode.extras}
          value={spec.extras ?? []}
          onChange={(extras) => onChange({ extras })}
        />
      )}

      {groupsByCode.allergen_swap && (
        <CheckboxOptionGroup
          group={groupsByCode.allergen_swap}
          value={spec.allergenSwap ?? []}
          onChange={(allergenSwap) => onChange({ allergenSwap })}
        />
      )}

      {groupsByCode.photo_print && (
        <div>
          <CheckboxOptionGroup
            group={groupsByCode.photo_print}
            value={spec.photoPrint ? ["photo_print"] : []}
            onChange={(values) => onChange({ photoPrint: values.includes("photo_print") })}
          />
          <p className="mt-2 font-body text-xs text-brand-chocolate/60">
            {hasReferenceImage
              ? "Uses the reference photo you dropped in the panel on the left."
              : "Drop a square photo (at least 1000px wide) in the panel on the left to print it."}
          </p>
        </div>
      )}
    </div>
  );
}
