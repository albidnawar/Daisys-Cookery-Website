import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { OrderViaChatButton } from "@/components/cake-detail/OrderViaChatButton";
import { toObjectPosition } from "@/lib/image/focal";
import type { CakeSummary } from "@/lib/types/domain";

export function CakeCard({ cake }: { cake: CakeSummary }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <Link href={`/cakes/${cake.slug}`} className="contents">
        <div className="relative aspect-4/3 overflow-hidden rounded-2xl bg-cream">
          {cake.heroImageUrl && (
            <Image
              src={cake.heroImageUrl}
              alt={cake.name}
              fill
              className="object-cover"
              style={{ objectPosition: toObjectPosition(cake.heroImageFocal) }}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          {cake.flavor && <Badge variant="mint">{cake.flavor.name}</Badge>}
          {cake.dietaryTags.map((tag) => (
            <Badge key={tag} variant="outline">
              {tag.replace("_", " ")}
            </Badge>
          ))}
        </div>
        <p className="font-display text-xl font-medium text-brand-chocolate">
          {cake.name}
        </p>
        <p className="line-clamp-2 font-body text-sm text-brand-chocolate/70">
          {cake.shortDescription}
        </p>
      </Link>
      <div className="mt-auto flex items-baseline justify-end pt-1">
        <Link
          href={`/customise/${cake.slug}`}
          className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
        >
          Customise
        </Link>
      </div>
      <OrderViaChatButton
        context={{ cakeName: cake.name, price: cake.basePrice }}
        className="w-full py-2! text-xs"
      />
    </Card>
  );
}
