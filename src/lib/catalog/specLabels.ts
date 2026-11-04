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

/** Flavor became a multi-select array after shipping as a single string —
 * same legacy-shape concern as formatCakeColor() below, since a frozen
 * cake_snapshot from before that change still has the old string sitting
 * in the database. */
export function labelsFor(
  groupsByCode: Record<string, OptionGroup>,
  code: string,
  valueCodes: string[] | string | undefined,
): string[] {
  if (!valueCodes) return [];
  const codes = Array.isArray(valueCodes) ? valueCodes : [valueCodes];
  return codes
    .map((c) => labelFor(groupsByCode, code, c))
    .filter((l): l is string => Boolean(l));
}

/** A short, comma-joined "flavor · message" summary line, the same shape
 * the basket and account order-history screens show. */
export function summarizeSpec(
  groupsByCode: Record<string, OptionGroup>,
  spec: DraftOrderSpec,
): string {
  const parts = [
    labelsFor(groupsByCode, "sponge", spec.sponge).join(", ") || null,
    spec.message ? `"${spec.message}"` : null,
  ].filter(Boolean);
  return parts.join(" · ") || "Custom cake";
}

/** cakeColor became a multi-select array after shipping as a single
 * string — an order's cake_snapshot is frozen at creation time, so any
 * order placed before that change still has the old string shape sitting
 * in the database. Every display site should read it through here rather
 * than assume one shape or the other. */
export function formatCakeColor(cakeColor: DraftOrderSpec["cakeColor"] | string): string | null {
  if (!cakeColor) return null;
  if (Array.isArray(cakeColor)) return cakeColor.length > 0 ? cakeColor.join(", ") : null;
  return cakeColor;
}
