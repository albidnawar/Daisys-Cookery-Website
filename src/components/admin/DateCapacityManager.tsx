"use client";

import { useState, useTransition } from "react";
import type { DateCapacityRow } from "@/lib/admin/logistics";

export function DateCapacityManager({ initialRows }: { initialRows: DateCapacityRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [saving, startSaving] = useTransition();

  const save = (date: string, patch: Partial<DateCapacityRow>) => {
    setRows((prev) => prev.map((r) => (r.date === date ? { ...r, ...patch } : r)));
    const row = { ...rows.find((r) => r.date === date)!, ...patch };
    startSaving(async () => {
      await fetch("/api/admin/logistics/date-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: row.date,
          isBlocked: row.isBlocked,
          maxOrders: row.maxOrders,
          note: row.note,
        }),
      });
    });
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-display text-xl font-semibold text-brand-chocolate">
          Daily order cap &amp; date locker
        </h2>
        {saving && <span className="font-body text-xs text-brand-chocolate/50">Saving…</span>}
      </div>
      <p className="mb-4 font-body text-xs text-brand-chocolate/60">
        Leave &ldquo;Max/day&rdquo; blank for no day-level limit (each slot still has its own
        capacity). Blocking a date hides it from customers entirely, regardless of slot capacity.
      </p>
      <div className="overflow-x-auto rounded-2xl border-2 border-brand-chocolate/10 bg-white">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-brand-chocolate/10 text-left text-xs uppercase tracking-widest text-brand-chocolate/50">
              <th className="p-3">Date</th>
              <th className="p-3">Booked today</th>
              <th className="p-3">Max/day</th>
              <th className="p-3">Blocked</th>
              <th className="p-3">Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dayLabel = new Date(`${row.date}T00:00:00`).toLocaleDateString("en-GB", {
                weekday: "short",
                day: "numeric",
                month: "short",
              });
              const overCap = row.maxOrders != null && row.bookedCount >= row.maxOrders;
              return (
                <tr key={row.date} className="border-b border-brand-chocolate/5 last:border-0">
                  <td className="p-3 font-bold text-brand-chocolate">{dayLabel}</td>
                  <td className={`p-3 ${overCap ? "font-bold text-red-600" : "text-brand-chocolate/70"}`}>
                    {row.bookedCount}
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      min={0}
                      value={row.maxOrders ?? ""}
                      onChange={(e) =>
                        save(row.date, { maxOrders: e.target.value === "" ? null : Number(e.target.value) })
                      }
                      className="input-field w-24"
                      placeholder="No limit"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={row.isBlocked}
                      onChange={(e) => save(row.date, { isBlocked: e.target.checked })}
                    />
                  </td>
                  <td className="p-3">
                    <input
                      value={row.note ?? ""}
                      onChange={(e) => save(row.date, { note: e.target.value || null })}
                      className="input-field"
                      placeholder="e.g. Eid holiday"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
