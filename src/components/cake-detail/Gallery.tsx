"use client";

import { useState } from "react";

export function Gallery({ images }: { images: string[] }) {
  const slots = images.length > 0 ? images : [""];
  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-4/3 w-full rounded-3xl border-2 border-brand-chocolate/10 bg-white" />
      {slots.length > 1 && (
        <div className="grid grid-cols-4 gap-4">
          {slots.map((src, i) => (
            <button
              key={src || i}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square rounded-2xl border-2 bg-white ${
                active === i ? "border-brand-orange" : "border-brand-chocolate/10"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
