"use client";

import { useState } from "react";
import { buildChatLink } from "@/lib/chat/buildChatLink";

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex flex-col gap-2 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-3 shadow-brand">
          <a
            href={buildChatLink("whatsapp")}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-full bg-[#25D366]/10 px-4 py-2 font-body text-sm font-bold text-[#128C4A] hover:bg-[#25D366]/20"
          >
            Chat on WhatsApp
          </a>
          <a
            href={buildChatLink("messenger")}
            target="_blank"
            rel="noopener noreferrer"
            className="whitespace-nowrap rounded-full bg-[#0084FF]/10 px-4 py-2 font-body text-sm font-bold text-[#0084FF] hover:bg-[#0084FF]/20"
          >
            Message us on Facebook
          </a>
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Chat with Daisy's Cookery"
        aria-expanded={open}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange text-white shadow-md shadow-brand-orange/30 hover:bg-brand-chocolate"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6 L18 18 M18 6 L6 18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
