"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { KANBAN_COLUMNS, type KanbanOrder } from "@/lib/admin/kanbanColumns";
import { todayKey } from "@/lib/dates";
import type { OrderStatus } from "@/lib/types/domain";

const ALL_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "received", label: "Received (pending approval)" },
  { value: "confirmed", label: "Confirmed (deposit verified)" },
  { value: "baking", label: "Baking/decorating" },
  { value: "ready", label: "Ready for pickup" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "collected", label: "Collected" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export function OrdersKanban({ initialOrders }: { initialOrders: KanbanOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [loading, startLoading] = useTransition();

  const refresh = (date: string) => {
    startLoading(async () => {
      const params = date ? `?date=${date}` : "";
      const res = await fetch(`/api/admin/orders${params}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    });
  };

  useEffect(() => {
    if (dateFilter !== "") refresh(dateFilter);
  }, [dateFilter]);

  const changeStatus = async (id: string, status: OrderStatus) => {
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh(dateFilter);
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
          Delivery/collection date
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field w-auto"
          />
        </label>
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            className="font-body text-sm font-bold text-brand-orange"
          >
            Clear
          </button>
        )}
        <button
          type="button"
          onClick={() => setDateFilter(todayKey())}
          className="font-body text-sm font-bold text-brand-orange"
        >
          Today
        </button>
        {loading && <span className="font-body text-xs text-brand-chocolate/50">Loading…</span>}
      </div>

      <div className="grid gap-4 overflow-x-auto pb-4 lg:grid-cols-5">
        {KANBAN_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <div key={col.key} className="flex min-w-[220px] flex-col gap-3">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                {col.label} ({columnOrders.length})
              </p>
              <div className="flex flex-col gap-3">
                {columnOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex flex-col gap-2 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs font-bold text-brand-chocolate">
                        {order.orderNumber}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-body text-[10px] font-bold ${
                          order.orderSource === "manual"
                            ? "bg-pink text-brand-chocolate"
                            : "bg-mint text-brand-chocolate"
                        }`}
                      >
                        {order.orderSource === "manual" ? "FB/Manual" : "Web"}
                      </span>
                    </div>
                    <p className="font-display text-base font-semibold text-brand-chocolate">
                      {order.cakeName}
                    </p>
                    <p className="font-body text-xs text-brand-chocolate/60">
                      {order.contactName} &middot; {order.contactPhone}
                    </p>
                    {order.slotLabel && (
                      <p className="font-body text-xs text-brand-chocolate/60">{order.slotLabel}</p>
                    )}
                    <p className="font-body text-xs text-brand-chocolate/70">
                      ৳{order.total.toLocaleString("en-BD")} &middot; {order.paymentStatus}
                    </p>
                    <select
                      value={order.status}
                      onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
                      className="input-field text-xs"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <Link
                      href={`/admin/orders/${order.id}/slip`}
                      target="_blank"
                      className="font-body text-xs font-bold text-brand-orange hover:text-brand-chocolate"
                    >
                      Print slip
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
