"use client";

import { useState } from "react";
import Image from "next/image";
import { toObjectPosition, type FocalPoint } from "@/lib/image/focal";

export type GalleryImage = { url: string; focal?: FocalPoint | null };

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const mainImage = images[active];

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-white">
        {mainImage && (
          <Image
            src={mainImage.url}
            alt=""
            fill
            className="object-cover"
            style={{ objectPosition: toObjectPosition(mainImage.focal) }}
            priority
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square overflow-hidden rounded-2xl border-2 bg-white ${
                active === i ? "border-brand-orange" : "border-brand-chocolate/10"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                style={{ objectPosition: toObjectPosition(img.focal) }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
