"use client";

import { useMemo, useState } from "react";
import type { CustomerSummary } from "@/lib/admin/customersCrm";

type SortKey = "spend" | "orders" | "recent";

export function CustomersCrm({ customers }: { customers: CustomerSummary[] }) {
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("spend");

  const rows = useMemo(() => {
    const filtered = repeatOnly ? customers.filter((c) => c.orderCount >= 2) : customers;
    const sorted = [...filtered];
    if (sortBy === "spend") sorted.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
    if (sortBy === "orders") sorted.sort((a, b) => b.orderCount - a.orderCount);
    if (sortBy === "recent") sorted.sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
    return sorted;
  }, [customers, repeatOnly, sortBy]);

  const repeatCount = customers.filter((c) => c.orderCount >= 2).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="font-body text-sm text-brand-chocolate/70">
          {customers.length} customers &middot; {repeatCount} repeat
        </p>
        <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
          <input type="checkbox" checked={repeatOnly} onChange={(e) => setRepeatOnly(e.target.checked)} />
          Repeat customers only
        </label>
        <label className="ml-auto flex items-center gap-2 font-body text-sm text-brand-chocolate">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="input-field w-auto"
          >
            <option value="spend">Lifetime spend</option>
            <option value="orders">Order count</option>
            <option value="recent">Most recent order</option>
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-brand-chocolate/10 bg-white">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-brand-chocolate/10 text-left text-xs uppercase tracking-widest text-brand-chocolate/50">
              <th className="p-3">Customer</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Lifetime spend</th>
              <th className="p-3">Last order</th>
              <th className="p-3">Account</th>
              <th className="p-3">Saved addresses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => (
              <tr key={customer.contactPhone} className="border-b border-brand-chocolate/5 last:border-0">
                <td className="p-3">
                  <p className="font-bold text-brand-chocolate">{customer.contactName}</p>
                  <p className="text-xs text-brand-chocolate/50">{customer.contactPhone}</p>
                </td>
                <td className="p-3 text-brand-chocolate/70">
                  {customer.orderCount}
                  {customer.orderCount >= 2 && (
                    <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-brand-chocolate">
                      Repeat
                    </span>
                  )}
                </td>
                <td className="p-3 font-bold text-brand-chocolate">
                  ৳{customer.lifetimeSpend.toLocaleString("en-BD")}
                </td>
                <td className="p-3 text-brand-chocolate/70">
                  {new Date(customer.lastOrderDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="p-3 text-brand-chocolate/70">{customer.customerId ? "Registered" : "Guest"}</td>
                <td className="p-3 text-brand-chocolate/70">{customer.savedAddressCount || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="mt-4 font-body text-sm text-brand-chocolate/60">No customers match this filter.</p>
      )}
    </div>
  );
}
