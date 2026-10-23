"use client";

import { useState } from "react";
import Image from "next/image";
import { toObjectPosition, type FocalPoint } from "@/lib/image/focal";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { CopyImageButton } from "@/components/shared/CopyImageButton";

export type GalleryImage = { url: string; focal?: FocalPoint | null };

const ZOOM_SCALE = 1.8;

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const mainImage = images[active];

  // Hovering (mouse) zooms the image in, following the cursor, and lets go
  // the moment the cursor leaves — a touch tap doesn't produce a sustained
  // hover, so on phones this never engages and the tap falls through to
  // the click handler below, which opens the full-screen lightbox instead.
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setOrigin({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-white">
        {/* A separate layer (not the outer div) owns the hover/click-to-view
            handlers, so the CopyImageButton — a sibling painted on top of
            it — intercepts the pointer over its own area instead of also
            triggering the zoom/lightbox underneath. */}
        <div
          className="absolute inset-0 cursor-zoom-in"
          onMouseEnter={() => setZoomed(true)}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomed(false)}
          onClick={() => setLightboxOpen(true)}
        >
          {mainImage && (
            <Image
              src={mainImage.url}
              alt=""
              fill
              className="object-cover transition-transform duration-200 ease-out"
              style={{
                objectPosition: toObjectPosition(mainImage.focal),
                transform: zoomed ? `scale(${ZOOM_SCALE})` : "scale(1)",
                transformOrigin: `${origin.x}% ${origin.y}%`,
              }}
              priority
            />
          )}
        </div>
        {mainImage && (
          <CopyImageButton src={mainImage.url} className="absolute right-3 top-3" />
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
      {lightboxOpen && mainImage && (
        <ImageLightbox src={mainImage.url} onClose={() => setLightboxOpen(false)} />
      )}
    </div>
  );
}
