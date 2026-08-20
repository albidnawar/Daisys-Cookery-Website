"use client";

import { useEffect, useState, useTransition } from "react";
import { todayKey } from "@/lib/dates";
import type { ManifestRow } from "@/lib/admin/logistics";

export function DeliveryManifest({ initialDate, initialRows }: { initialDate: string; initialRows: ManifestRow[] }) {
  const [date, setDate] = useState(initialDate);
  const [rows, setRows] = useState(initialRows);
  const [loading, startLoading] = useTransition();

  useEffect(() => {
    startLoading(async () => {
      const res = await fetch(`/api/admin/logistics/manifest?date=${date}`);
      const data = await res.json();
      setRows(data.rows ?? []);
    });
  }, [date]);

  const groups = new Map<string, ManifestRow[]>();
  for (const row of rows) {
    const key = row.fulfilmentType === "pickup" ? "Shop pickup" : row.zoneName;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold text-brand-chocolate">
          Delivery manifest &amp; zone grouping
        </h2>
        <label className="ml-auto flex items-center gap-2 font-body text-sm text-brand-chocolate">
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
        <a
          href={`/api/admin/logistics/manifest?date=${date}&format=csv`}
          className="rounded-full bg-brand-orange px-4 py-2 font-body text-sm font-bold text-white hover:bg-brand-chocolate"
        >
          Export CSV
        </a>
        {loading && <span className="font-body text-xs text-brand-chocolate/50">Loading…</span>}
      </div>

      {rows.length === 0 ? (
        <p className="font-body text-sm text-brand-chocolate/60">No orders scheduled for this date.</p>
      ) : (
        <div className="flex flex-col gap-6">
          {[...groups.entries()].map(([zone, zoneRows]) => (
            <div key={zone}>
              <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                {zone} ({zoneRows.length})
              </p>
              <div className="flex flex-col gap-2">
                {zoneRows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4"
                  >
                    <div>
                      <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
                        {row.orderNumber} &middot; {row.slotLabel ?? "—"}
                      </p>
                      <p className="font-display text-base font-semibold text-brand-chocolate">
                        {row.contactName} &middot; {row.contactPhone}
                      </p>
                      <p className="font-body text-sm text-brand-chocolate/70">
                        {row.cakeName}
                        {row.addressText && <> &middot; {row.addressText}</>}
                      </p>
                    </div>
                    <p className="font-body text-sm font-bold text-brand-chocolate">
                      COD: ৳{row.codAmount.toLocaleString("en-BD")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
