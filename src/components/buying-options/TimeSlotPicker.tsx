"use client";

import { useEffect } from "react";
import { formatTimeAmPm } from "@/lib/dates";

// Soft guardrails on the exact-time input (shop open/close bounds) — not
// enforced server-side, just min/max on the <input type="time"> so a
// customer can't type "3am" even though there's no longer a discrete list
// of windows to choose from.
const HOURS: Record<"pickup" | "delivery", [string, string]> = {
  pickup: ["09:00", "21:00"],
  delivery: ["10:00", "20:00"],
};

const COPY = {
  en: {
    hint: (min: string, max: string) => `Between ${min} and ${max}`,
    confirming: "Checking…",
    confirmed: "Time set ✓",
  },
  bn: {
    hint: (min: string, max: string) => `${min} থেকে ${max} এর মধ্যে`,
    confirming: "যাচাই করা হচ্ছে…",
    confirmed: "সময় নির্ধারিত ✓",
  },
} as const;

/** Auto-books the chosen time (debounced) as soon as the customer stops
 * typing — no separate "confirm" click. */
export function TimeSlotPicker({
  fulfilmentType,
  value,
  onChange,
  onConfirm,
  confirmed,
  confirming,
  error,
  locale = "en",
}: {
  fulfilmentType: "pickup" | "delivery";
  value: string;
  onChange: (time: string) => void;
  onConfirm: () => void;
  confirmed: boolean;
  confirming: boolean;
  error: string | null;
  locale?: "en" | "bn";
}) {
  const t = COPY[locale];
  const [minTime, maxTime] = HOURS[fulfilmentType];

  useEffect(() => {
    if (!value) return;
    const timer = setTimeout(onConfirm, 500);
    return () => clearTimeout(timer);
    // Only re-run when the typed time itself changes — onConfirm is a
    // fresh closure every render, re-running on it too would refire the
    // hold request without the time actually changing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="time"
          value={value}
          min={minTime}
          max={maxTime}
          onChange={(e) => onChange(e.target.value)}
          className="input-field w-auto"
        />
        {confirming && (
          <span className="font-body text-sm text-brand-chocolate/50">{t.confirming}</span>
        )}
        {!confirming && confirmed && (
          <span className="rounded-full border-2 border-brand-orange bg-brand-orange/10 px-3 py-1 font-body text-sm font-bold text-brand-orange">
            {t.confirmed}
          </span>
        )}
      </div>
      <p className="font-body text-xs text-brand-chocolate/50">
        {t.hint(formatTimeAmPm(minTime), formatTimeAmPm(maxTime))}
      </p>
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
    </div>
  );
}
