import type { DraftOrderSpec } from "@/lib/types/domain";

/** Prefers the new multi-image array; falls back to the legacy single-URL
 * field so historical orders (and admin-entered manual orders, which still
 * only write the single field) keep rendering correctly. */
export function getReferenceImages(spec: DraftOrderSpec): string[] {
  if (spec.referenceImageUrls?.length) return spec.referenceImageUrls;
  return spec.referenceImageUrl ? [spec.referenceImageUrl] : [];
}
