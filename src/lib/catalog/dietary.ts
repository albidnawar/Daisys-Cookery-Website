import type { DietaryTag } from "@/lib/types/domain";

export const DIETARY_OPTIONS: { tag: DietaryTag; label: string }[] = [
  { tag: "eggless", label: "Eggless" },
  { tag: "gluten_free", label: "Gluten-free" },
  { tag: "vegan", label: "Vegan" },
  { tag: "sugar_free", label: "Sugar-free" },
];
