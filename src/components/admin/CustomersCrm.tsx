"use client";

import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CustomerSummary } from "@/lib/admin/customersCrm";

type SortKey = "spend" | "orders" | "recent";

const PAGE_SIZE = 20;

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function CustomersCrm({ customers }: { customers: CustomerSummary[] }) {
  const router = useRouter();
  const [repeatOnly, setRepeatOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("spend");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editingPhone, setEditingPhone] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const sorted = useMemo(() => {
    const filtered = repeatOnly ? customers.filter((c) => c.orderCount >= 2) : customers;
    const next = [...filtered];
    if (sortBy === "spend") next.sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
    if (sortBy === "orders") next.sort((a, b) => b.orderCount - a.orderCount);
    if (sortBy === "recent") next.sort((a, b) => b.lastOrderDate.localeCompare(a.lastOrderDate));
    return next;
  }, [customers, repeatOnly, sortBy]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const repeatCount = customers.filter((c) => c.orderCount >= 2).length;

  function changeFilter(next: () => void) {
    next();
    setPage(1);
  }

  function toggleExpanded(phone: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(phone)) next.delete(phone);
      else next.add(phone);
      return next;
    });
  }

  function startEditing(customer: CustomerSummary) {
    setEditingPhone(customer.contactPhone);
    setEditValue(customer.manualTag ?? "");
  }

  async function saveTag(phone: string) {
    setSaving(true);
    try {
      await fetch("/api/admin/customers/event-tag", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactPhone: phone, tag: editValue.trim() }),
      });
      setEditingPhone(null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <p className="font-body text-sm text-brand-chocolate/70">
          {customers.length} customers &middot; {repeatCount} repeat
        </p>
        <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
          <input
            type="checkbox"
            checked={repeatOnly}
            onChange={(e) => changeFilter(() => setRepeatOnly(e.target.checked))}
          />
          Repeat customers only
        </label>
        <label className="ml-auto flex items-center gap-2 font-body text-sm text-brand-chocolate">
          Sort by
          <select
            value={sortBy}
            onChange={(e) => changeFilter(() => setSortBy(e.target.value as SortKey))}
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
              <th className="p-3" />
              <th className="p-3">Customer</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Occasion</th>
              <th className="p-3">Lifetime spend</th>
              <th className="p-3">Last order</th>
              <th className="p-3">Account</th>
              <th className="p-3">Saved addresses</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((customer) => {
              const isOpen = expanded.has(customer.contactPhone);
              const occasions = [...new Set(customer.orders.map((o) => o.eventCategory).filter(Boolean))];
              return (
                <Fragment key={customer.contactPhone}>
                  <tr className="border-b border-brand-chocolate/5 last:border-0">
                    <td className="p-3">
                      {customer.orders.length > 1 && (
                        <button
                          type="button"
                          onClick={() => toggleExpanded(customer.contactPhone)}
                          className="font-bold text-brand-orange"
                          aria-label={isOpen ? "Collapse order history" : "Expand order history"}
                        >
                          {isOpen ? "▾" : "▸"}
                        </button>
                      )}
                    </td>
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
                    <td className="p-3">
                      {editingPhone === customer.contactPhone ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="e.g. Birthday"
                            autoFocus
                            className="input-field w-32 text-xs"
                          />
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => saveTag(customer.contactPhone)}
                            className="font-bold text-brand-orange"
                          >
                            Save
                          </button>
                          <button type="button" onClick={() => setEditingPhone(null)} className="text-brand-chocolate/50">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {occasions.map((occasion) => (
                            <span
                              key={occasion}
                              className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-xs font-bold text-brand-orange"
                            >
                              {occasion}
                            </span>
                          ))}
                          {customer.manualTag && (
                            <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-brand-chocolate">
                              {customer.manualTag}
                            </span>
                          )}
                          {occasions.length === 0 && !customer.manualTag && (
                            <span className="text-brand-chocolate/40">-</span>
                          )}
                          <button
                            type="button"
                            onClick={() => startEditing(customer)}
                            className="text-xs text-brand-chocolate/40 hover:text-brand-orange"
                            aria-label="Edit occasion tag"
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-bold text-brand-chocolate">
                      ৳{customer.lifetimeSpend.toLocaleString("en-BD")}
                    </td>
                    <td className="p-3 text-brand-chocolate/70">{formatDate(customer.lastOrderDate)}</td>
                    <td className="p-3 text-brand-chocolate/70">{customer.customerId ? "Registered" : "Guest"}</td>
                    <td className="p-3 text-brand-chocolate/70">{customer.savedAddressCount || "-"}</td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-brand-chocolate/5 bg-brand-cream/30 last:border-0">
                      <td />
                      <td colSpan={7} className="p-3">
                        <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                          Order history ({customer.orders.length})
                        </p>
                        <ul className="flex flex-col gap-1">
                          {customer.orders.map((order, i) => (
                            <li
                              key={`${order.date}-${i}`}
                              className="flex items-center justify-between gap-3 font-body text-sm text-brand-chocolate"
                            >
                              <span>{formatDate(order.date)}</span>
                              {order.eventCategory && (
                                <span className="rounded-full bg-brand-orange/10 px-2 py-0.5 text-xs font-bold text-brand-orange">
                                  {order.eventCategory}
                                </span>
                              )}
                              <span className="ml-auto font-bold">৳{order.total.toLocaleString("en-BD")}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="mt-4 font-body text-sm text-brand-chocolate/60">No customers match this filter.</p>
      )}

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="font-body text-xs text-brand-chocolate/60">
            Page {currentPage} of {pageCount}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border-2 border-brand-chocolate/15 px-4 py-2 font-body text-xs font-bold text-brand-chocolate disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border-2 border-brand-chocolate/15 px-4 py-2 font-body text-xs font-bold text-brand-chocolate disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
