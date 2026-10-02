export type FocalPoint = { x: number; y: number };

export const DEFAULT_FOCAL: FocalPoint = { x: 0.5, y: 0.5 };

/** For inline `style={{ objectPosition: ... }}` on an `object-cover` image —
 * `next/image` only applies `objectPosition` via style, not a prop. */
export function toObjectPosition(focal: FocalPoint | null | undefined): string {
  const f = focal ?? DEFAULT_FOCAL;
  return `${f.x * 100}% ${f.y * 100}%`;
}
