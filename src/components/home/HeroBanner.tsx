import Image from "next/image";
import Link from "next/link";
import type { HeroBanner as HeroBannerData } from "@/lib/home/heroBanner";

export function HeroBanner({ banner }: { banner: HeroBannerData | null }) {
  const frame = (
    <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-white shadow-brand">
      {banner?.imageUrl ? (
        <Image src={banner.imageUrl} alt="" fill className="object-cover" priority />
      ) : (
        <Image
          src="/next.svg"
          alt="Placeholder hero cake photograph"
          fill
          className="object-contain p-16 opacity-30"
        />
      )}
    </div>
  );

  if (banner?.linkUrl) {
    return <Link href={banner.linkUrl}>{frame}</Link>;
  }
  return frame;
}
