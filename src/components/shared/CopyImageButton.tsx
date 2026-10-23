"use client";

import { useState } from "react";
import { copyImageToClipboard } from "@/lib/image/copyToClipboard";

const LABELS = {
  idle: "Copy image",
  copying: "Copying…",
  copied: "Copied!",
  error: "Couldn't copy",
} as const;

/** Lets a customer copy a cake photo straight to their clipboard so they
 * can paste it into a Facebook Messenger chat with the shop — Messenger's
 * m.me deep link (see the site's chat widget) can't carry an image or
 * prefilled text on its own. */
export function CopyImageButton({
  src,
  className = "",
}: {
  src: string;
  className?: string;
}) {
  const [state, setState] = useState<keyof typeof LABELS>("idle");

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setState("copying");
    try {
      await copyImageToClipboard(src);
      setState("copied");
    } catch {
      setState("error");
    } finally {
      setTimeout(() => setState("idle"), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === "copying"}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 font-body text-xs font-bold text-brand-chocolate shadow-sm hover:bg-white ${className}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
      </svg>
      {LABELS[state]}
    </button>
  );
}
