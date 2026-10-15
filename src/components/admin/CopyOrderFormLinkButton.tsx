"use client";

import { useState } from "react";

export function CopyOrderFormLinkButton() {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(`${window.location.origin}/order-form`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-2 rounded-full border-2 border-brand-chocolate/15 bg-white px-4 py-2 font-body text-sm font-bold text-brand-chocolate hover:border-brand-orange/40"
    >
      {copied ? "Copied!" : "Copy order form link"}
    </button>
  );
}
