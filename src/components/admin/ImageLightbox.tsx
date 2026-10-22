"use client";

import { useEffect, useRef, useState } from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 5;

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

function touchDistance(a: React.Touch, b: React.Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

/** Full-screen zoomable viewer for a reference/cake photo — click a
 * thumbnail to open it, then wheel-zoom or pinch-zoom (phone) and drag to
 * pan once zoomed in. Read-only: no crop, no save, just a closer look. */
export function ImageLightbox({
  src,
  alt = "",
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const pinchRef = useRef<{ startDist: number; startScale: number } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const zoomBy = (factor: number) => setScale((s) => clampScale(s * factor));
  const reset = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 1.15 : 1 / 1.15);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchRef.current = { startDist: touchDistance(e.touches[0], e.touches[1]), startScale: scale };
    } else if (e.touches.length === 1 && scale > 1) {
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        originX: translate.x,
        originY: translate.y,
      };
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchRef.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches[0], e.touches[1]);
      setScale(clampScale(pinchRef.current.startScale * (dist / pinchRef.current.startDist)));
    } else if (e.touches.length === 1 && dragRef.current) {
      e.preventDefault();
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      setTranslate({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) pinchRef.current = null;
    if (e.touches.length < 1) dragRef.current = null;
  };

  const onMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, originX: translate.x, originY: translate.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setTranslate({ x: dragRef.current.originX + dx, y: dragRef.current.originY + dy });
  };
  const stopDragging = () => {
    dragRef.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.9)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => zoomBy(1 / 1.3)}
            aria-label="Zoom out"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1.3)}
            aria-label="Zoom in"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl font-bold text-white hover:bg-white/20"
          >
            +
          </button>
          {scale > 1 && (
            <button
              type="button"
              onClick={reset}
              className="flex h-10 items-center justify-center rounded-full bg-white/10 px-4 font-body text-sm font-bold text-white hover:bg-white/20"
            >
              Reset
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
        >
          ✕
        </button>
      </div>
      <div
        className="flex-1 touch-none select-none overflow-hidden"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="h-full w-full object-contain"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: scale > 1 ? "grab" : "default",
          }}
        />
      </div>
    </div>
  );
}
