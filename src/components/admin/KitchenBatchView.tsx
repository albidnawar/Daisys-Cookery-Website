"use client";

import { useEffect, useState, useTransition } from "react";
import { todayKey } from "@/lib/dates";
import type { KitchenBatchLine } from "@/lib/admin/ordersAdmin";

export function KitchenBatchView({ initialDate, initialBatch }: { initialDate: string; initialBatch: KitchenBatchLine[] }) {
  const [date, setDate] = useState(initialDate);
  const [batch, setBatch] = useState(initialBatch);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    startLoading(async () => {
      const res = await fetch(`/api/admin/kitchen-batch?date=${date}`);
      const data = await res.json();
      setBatch(data.batch ?? []);
    });
  }, [date]);

  const totalCakes = batch.reduce((sum, line) => sum + line.count, 0);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-auto"
          />
        </label>
        <button
          type="button"
          onClick={() => setDate(todayKey())}
          className="font-body text-sm font-bold text-brand-orange"
        >
          Today
        </button>
        {loading && <span className="font-body text-xs text-brand-chocolate/50">Loading…</span>}
      </div>

      <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
        <p className="mb-4 font-display text-xl font-semibold text-brand-chocolate">
          Today&apos;s batch — {totalCakes} cake{totalCakes === 1 ? "" : "s"}
        </p>
        {batch.length === 0 ? (
          <p className="font-body text-sm text-brand-chocolate/60">
            No orders scheduled for this date yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {batch.map((line) => (
              <li
                key={`${line.cakeName}-${line.sizeLb}-${line.sponge}`}
                className="flex items-center justify-between border-b border-brand-chocolate/5 py-2 font-body text-sm last:border-0"
              >
                <span className="text-brand-chocolate">
                  {line.sizeLb} lb {line.cakeName}
                  {line.sponge ? ` (${line.sponge})` : ""}
                </span>
                <span className="font-bold text-brand-orange">×{line.count}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
