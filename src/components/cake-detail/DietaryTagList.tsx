import { Badge } from "@/components/ui/Badge";

export function DietaryTagList({
  tags,
  labels,
}: {
  tags: string[];
  labels: Record<string, string>;
}) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge key={tag} variant="mint">
          {labels[tag] ?? tag}
        </Badge>
      ))}
    </div>
  );
}
