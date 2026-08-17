import { Badge } from "@/components/ui/Badge";
import type { DietaryTag } from "@/lib/types/domain";

const LABELS: Record<DietaryTag, string> = {
  eggless: "Eggless",
  gluten_free: "Gluten-free swap",
  vegan: "Vegan",
  sugar_free: "Sugar-free",
};

export function DietaryTagList({ tags }: { tags: DietaryTag[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="mint">
          {LABELS[tag]}
        </Badge>
      ))}
    </div>
  );
}
