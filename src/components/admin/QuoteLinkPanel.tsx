"use client";

import { useState } from "react";
import type { CustomQuoteStatus } from "@/lib/types/domain";

function buildQuoteMessage(cakeTitle: string, price: number, url: string): string {
  return [
    `Hi! Here's your quote from Daisy's Cookery for: ${cakeTitle}`,
    `Price: ৳${price.toLocaleString("en-BD")} (30% deposit to book)`,
    `Book it here: ${url}`,
  ].join("\n");
}

export function QuoteLinkPanel({
  quoteId,
  status,
  quotedPrice,
  contactPhone,
  cakeTitle,
}: {
  quoteId: string;
  status: CustomQuoteStatus;
  quotedPrice: number | null;
  contactPhone: string;
  cakeTitle: string;
}) {
  const [copied, setCopied] = useState(false);

  if (status !== "quoted" || quotedPrice == null) {
    return (
      <div className="w-full max-w-sm rounded-3xl border-2 border-dashed border-brand-chocolate/15 p-6 font-body text-sm text-brand-chocolate/60">
        Set a price and switch status to &ldquo;Quoted&rdquo;, then save — a shareable
        checkout link will appear here.
      </div>
    );
  }

  const quoteUrl = `${window.location.origin}/quote/${quoteId}`;
  const message = buildQuoteMessage(cakeTitle || "your custom cake", quotedPrice, quoteUrl);
  const waLink = `https://wa.me/${contactPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(message)}`;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
      <p className="font-display text-lg font-semibold text-brand-chocolate">Send the quote</p>
      <label className="flex flex-col gap-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        Checkout link
        <input readOnly value={quoteUrl} className="input-field text-sm" onFocus={(e) => e.target.select()} />
      </label>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(quoteUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="font-body text-sm font-bold text-brand-chocolate/70 hover:text-brand-orange"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
      <a
        href={waLink}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-5 py-3 text-center font-body text-sm font-bold text-white shadow-md shadow-brand-orange/20 hover:bg-brand-chocolate"
      >
        Open pre-filled WhatsApp message
      </a>
    </div>
  );
}
