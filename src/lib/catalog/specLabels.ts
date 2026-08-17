import type { DraftOrderSpec, OptionGroup } from "@/lib/types/domain";

export function labelFor(
  groupsByCode: Record<string, OptionGroup>,
  code: string,
  valueCode?: string,
): string | null {
  if (!valueCode) return null;
  return (
    groupsByCode[code]?.values.find((v) => v.valueCode === valueCode)?.label ??
    valueCode
  );
}

/** A short, comma-joined "sponge · filling · finish · message" summary
 * line, the same shape the basket and account order-history screens show. */
export function summarizeSpec(
  groupsByCode: Record<string, OptionGroup>,
  spec: DraftOrderSpec,
): string {
  const parts = [
    labelFor(groupsByCode, "sponge", spec.sponge),
    labelFor(groupsByCode, "filling", spec.filling),
    labelFor(groupsByCode, "frosting_finish", spec.frostingFinish),
    spec.message ? `"${spec.message}"` : null,
  ].filter(Boolean);
  return parts.join(" · ") || "Custom cake";
}
