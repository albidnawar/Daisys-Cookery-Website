"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { ALL_ORDER_STATUSES, KANBAN_COLUMNS, type KanbanOrder } from "@/lib/admin/kanbanColumns";
import { formatSlotLabelForDisplay, formatTimeAmPm, todayKey } from "@/lib/dates";
import type { OrderStatus } from "@/lib/types/domain";

/** riderPickupAt is a timestamptz instant — format just its local time of
 * day through the site's one am/pm house style (formatTimeAmPm), the same
 * way a slot's start/end time is shown. */
function formatRiderPickupTime(riderPickupAt: string): string {
  const date = new Date(riderPickupAt);
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return formatTimeAmPm(`${hh}:${mm}`);
}

// A column can cover more than one status (e.g. "Ready" spans ready/out_for_delivery).
// Dropping a card into such a column resolves the exact status from the order's fulfilment type.
function resolveDropStatus(columnKey: string, order: KanbanOrder): OrderStatus {
  if (columnKey === "ready") return order.fulfilmentType === "delivery" ? "out_for_delivery" : "ready";
  if (columnKey === "completed") return order.fulfilmentType === "delivery" ? "delivered" : "collected";
  return KANBAN_COLUMNS.find((c) => c.key === columnKey)!.statuses[0];
}

export function OrdersKanban({ initialOrders }: { initialOrders: KanbanOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [loading, startLoading] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

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
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    refresh(dateFilter);
  };

  const handleDrop = (columnKey: string) => {
    setDragOverCol(null);
    if (!draggingId) return;
    const order = orders.find((o) => o.id === draggingId);
    setDraggingId(null);
    if (!order) return;
    const nextStatus = resolveDropStatus(columnKey, order);
    if (nextStatus === order.status) return;
    changeStatus(order.id, nextStatus);
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

      {/* A plain flex row (not CSS grid) so columns always sit side by
          side with a horizontal scrollbar below the point where all five
          fit — a grid with no explicit column count below its one
          breakpoint collapsed every column into a single implicit track,
          stacking cards from different statuses on top of each other on
          iPad/laptop-width screens. */}
      <div className="flex gap-6 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const columnOrders = orders.filter((o) => col.statuses.includes(o.status));
          return (
            <div
              key={col.key}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOverCol !== col.key) setDragOverCol(col.key);
              }}
              onDragLeave={() => setDragOverCol((c) => (c === col.key ? null : c))}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(col.key);
              }}
              className={`flex w-72 shrink-0 flex-col gap-3 rounded-2xl p-2 transition-colors ${
                dragOverCol === col.key ? "bg-brand-orange/10 ring-2 ring-brand-orange/40" : ""
              }`}
            >
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                {col.label} ({columnOrders.length})
              </p>
              <div className="flex flex-col gap-3">
                {columnOrders.map((order) => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggingId(order.id);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", order.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverCol(null);
                    }}
                    className={`flex cursor-grab select-none flex-col gap-2 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-3 active:cursor-grabbing ${
                      draggingId === order.id ? "opacity-40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        draggable={false}
                        className="font-body text-xs font-bold text-brand-chocolate hover:text-brand-orange"
                      >
                        {order.orderNumber}
                      </Link>
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
                    {order.cakeImageUrl && (
                      <a
                        href={order.cakeImageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        draggable={false}
                        onPointerDown={(e) => e.stopPropagation()}
                        className="block h-20 w-full overflow-hidden rounded-lg bg-cream"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.cakeImageUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </a>
                    )}
                    <p className="font-display text-base font-semibold text-brand-chocolate">
                      {order.cakeName}
                    </p>
                    <p className="font-body text-xs text-brand-chocolate/60">
                      {order.contactName} &middot; {order.contactPhone}
                    </p>
                    {order.slotLabel && (
                      <p className="font-body text-xs text-brand-chocolate/60">
                        {formatSlotLabelForDisplay(order.slotLabel)}
                      </p>
                    )}
                    {order.riderName && (
                      <p className="font-body text-xs text-brand-chocolate/60">
                        🛵 {order.riderName}
                        {order.riderPhone ? ` · ${order.riderPhone}` : ""}
                        {order.riderPickupAt ? ` · Pickup ${formatRiderPickupTime(order.riderPickupAt)}` : ""}
                      </p>
                    )}
                    <p className="font-body text-xs text-brand-chocolate/70">
                      ৳{order.total.toLocaleString("en-BD")} &middot; {order.paymentStatus}
                    </p>
                    {order.total === 0 && order.depositAmount > 0 ? (
                      <p className="font-body text-xs font-bold text-brand-orange">
                        Advance paid: ৳{order.depositAmount.toLocaleString("en-BD")} (price pending)
                      </p>
                    ) : (
                      order.paymentStatus !== "paid_in_full" && order.paymentStatus !== "refunded" && (
                        <p className="font-body text-xs font-bold text-brand-orange">
                          Due: ৳{order.balanceDue.toLocaleString("en-BD")}
                        </p>
                      )
                    )}
                    <select
                      value={order.status}
                      onChange={(e) => changeStatus(order.id, e.target.value as OrderStatus)}
                      onPointerDown={(e) => e.stopPropagation()}
                      draggable={false}
                      className="input-field text-xs"
                    >
                      {ALL_ORDER_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <Link
                      href={`/admin/orders/${order.id}/slip`}
                      target="_blank"
                      draggable={false}
                      onPointerDown={(e) => e.stopPropagation()}
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
