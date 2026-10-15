"use client";

import { useCallback, useRef, useState } from "react";
import { DEFAULT_FOCAL, toObjectPosition, type FocalPoint } from "@/lib/image/focal";
import { rotateImage } from "@/lib/image/rotateImage";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Drag-to-reposition focal point picker: shown over an already-uploaded
 * photo so the admin can choose what stays centered when object-cover
 * crops it elsewhere on the site. Non-destructive — only stores a 0-1
 * x/y pair, consumed as CSS object-position wherever the photo renders. */
export function FocalPointPicker({
  src,
  value,
  onChange,
  onRotate,
  aspectClassName = "aspect-4/3",
}: {
  src: string;
  value: FocalPoint | null | undefined;
  onChange: (point: FocalPoint) => void;
  /** When provided, shows rotate-left/right buttons that physically
   * rotate the stored image 90 degrees at a time and hand back the new
   * URL — the photo itself changes, not just how it's displayed. */
  onRotate?: (newUrl: string) => void;
  aspectClassName?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [rotateError, setRotateError] = useState<string | null>(null);
  const focal = value ?? DEFAULT_FOCAL;

  const rotate = async (degrees: 90 | -90) => {
    if (!onRotate) return;
    setRotating(true);
    setRotateError(null);
    try {
      onRotate(await rotateImage(src, degrees));
    } catch (e) {
      setRotateError(e instanceof Error ? e.message : "Couldn't rotate that image");
    } finally {
      setRotating(false);
    }
  };

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      onChange({
        x: clamp((clientX - rect.left) / rect.width, 0, 1),
        y: clamp((clientY - rect.top) / rect.height, 0, 1),
      });
    },
    [onChange],
  );

  return (
    <div>
      <div
        ref={containerRef}
        className={`relative ${aspectClassName} w-full max-w-xs cursor-crosshair touch-none overflow-hidden rounded-2xl border-2 border-brand-chocolate/25 bg-cream`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setDragging(true);
          updateFromPoint(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (dragging) updateFromPoint(e.clientX, e.clientY);
        }}
        onPointerUp={() => setDragging(false)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          style={{ objectPosition: toObjectPosition(focal) }}
        />
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-orange shadow-md"
          style={{ left: `${focal.x * 100}%`, top: `${focal.y * 100}%` }}
        />
        {onRotate && (
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                rotate(-90);
              }}
              disabled={rotating}
              title="Rotate left"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-chocolate shadow-md hover:bg-white disabled:opacity-50"
            >
              ↺
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                rotate(90);
              }}
              disabled={rotating}
              title="Rotate right"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-brand-chocolate shadow-md hover:bg-white disabled:opacity-50"
            >
              ↻
            </button>
          </div>
        )}
      </div>
      <p className="mt-1 max-w-xs font-body text-xs text-brand-chocolate/50">
        Click or drag on the photo to choose what stays visible when it&apos;s cropped
        elsewhere on the site.
      </p>
      {rotateError && <p className="mt-1 font-body text-xs text-red-600">{rotateError}</p>}
    </div>
  );
}
