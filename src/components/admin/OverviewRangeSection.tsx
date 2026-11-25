"use client";

import { useState } from "react";
import useSWR from "swr";
import type { OverviewRangeStats, RankedStat } from "@/lib/admin/analytics";
import { todayKey } from "@/lib/dates";
import { jsonFetcher } from "@/lib/swr/fetcher";

function thisMonthStart(): string {
  return todayKey().slice(0, 8) + "01";
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

const QUICK_RANGES: { label: string; from: () => string; to: () => string }[] = [
  { label: "This month", from: thisMonthStart, to: todayKey },
  { label: "Last 30 days", from: () => daysAgo(30), to: todayKey },
  { label: "Last 90 days", from: () => daysAgo(90), to: todayKey },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
      <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-chocolate">{value}</p>
    </div>
  );
}

function RankedList({ title, items, emptyText }: { title: string; items: RankedStat[]; emptyText: string }) {
  return (
    <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
      <p className="mb-3 font-display text-lg font-semibold text-brand-chocolate">{title}</p>
      {items.length === 0 ? (
        <p className="font-body text-sm text-brand-chocolate/60">{emptyText}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center justify-between font-body text-sm">
              <span className="text-brand-chocolate">
                {i + 1}. {item.label}
              </span>
              <span className="font-bold text-brand-orange">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function OverviewRangeSection({ initialStats }: { initialStats: OverviewRangeStats }) {
  const [from, setFrom] = useState(thisMonthStart());
  const [to, setTo] = useState(todayKey());
  const [initialFrom] = useState(from);
  const [initialTo] = useState(to);

  const key = `/api/admin/analytics?from=${from}&to=${to}`;
  const { data, isValidating } = useSWR<OverviewRangeStats>(key, jsonFetcher, {
    fallbackData: from === initialFrom && to === initialTo ? initialStats : undefined,
  });
  const stats = data ?? initialStats;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-semibold text-brand-chocolate">Date range report</h2>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
            From
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="input-field w-auto"
            />
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={todayKey()}
              onChange={(e) => setTo(e.target.value)}
              className="input-field w-auto"
            />
          </label>
          {QUICK_RANGES.map((range) => (
            <button
              key={range.label}
              type="button"
              onClick={() => {
                setFrom(range.from());
                setTo(range.to());
              }}
              className="font-body text-sm font-bold text-brand-orange"
            >
              {range.label}
            </button>
          ))}
          {isValidating && <span className="font-body text-xs text-brand-chocolate/50">Loading…</span>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={`৳${stats.revenue.toLocaleString("en-BD")}`} />
        <StatCard label="Orders" value={String(stats.orderCount)} />
        <StatCard label="Web orders" value={String(stats.webOrderCount)} />
        <StatCard label="Manual / FB inbox orders" value={String(stats.manualOrderCount)} />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <RankedList title="Top flavors" items={stats.topFlavors} emptyText="No flavor data yet." />
        <RankedList title="Popular weights" items={stats.topWeights} emptyText="No orders yet." />
        <RankedList title="Top requested themes" items={stats.topKeywords} emptyText="No orders yet." />
      </div>
    </div>
  );
}
