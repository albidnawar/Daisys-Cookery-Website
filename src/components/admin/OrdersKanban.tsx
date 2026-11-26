"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { KANBAN_COLUMNS, NON_CANCEL_ORDER_STATUSES, type KanbanOrder } from "@/lib/admin/kanbanColumns";
import { formatSlotLabelForDisplay, formatTimeAmPm, todayKey } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { jsonFetcher } from "@/lib/swr/fetcher";
import type { OrderStatus } from "@/lib/types/domain";

// Shape of a raw `orders` row as Supabase Realtime sends it on an UPDATE —
// plain table columns, no joined delivery_slots/catalog data. Used to patch
// a card in place without a refetch; see the "admins can select all
// orders" RLS policy (migration 0036) that makes these events visible to
// an admin's browser session at all.
type RawOrderRow = {
  id: string;
  status: OrderStatus;
  payment_status: string;
  fulfilment_type: "pickup" | "delivery";
  contact_name: string;
  contact_phone: string;
  rider_name: string | null;
  rider_phone: string | null;
  rider_pickup_at: string | null;
  total: number | string;
  deposit_amount: number | string;
  balance_due: number | string;
  cake_snapshot: { name: string; slug: string | null } | null;
};

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

/** Mirrors updateOrderStatus()'s auto-settle rule server-side — handing
 * over the cake also settles the remaining cash balance — so the card's
 * payment status/Due line stays correct without a refetch. */
function applyStatus(orders: KanbanOrder[], id: string, status: OrderStatus): KanbanOrder[] {
  return orders.map((o) => {
    if (o.id !== id) return o;
    const autoSettle =
      (status === "collected" || status === "delivered") &&
      o.paymentStatus !== "paid_in_full" &&
      o.paymentStatus !== "refunded";
    return { ...o, status, paymentStatus: autoSettle ? "paid_in_full" : o.paymentStatus };
  });
}

export function OrdersKanban({ initialOrders }: { initialOrders: KanbanOrder[] }) {
  const [dateFilter, setDateFilter] = useState<string>("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const key = `/api/admin/orders${dateFilter ? `?date=${dateFilter}` : ""}`;
  const { data, isValidating, mutate } = useSWR<{ orders: KanbanOrder[] }>(key, jsonFetcher, {
    fallbackData: dateFilter === "" ? { orders: initialOrders } : undefined,
  });
  const orders = data?.orders ?? [];
  const loading = isValidating;

  // Keeps the board in sync when another admin (or another tab) changes an
  // order, without polling or re-fetching the whole list ourselves. A new
  // order needs a full refresh (we don't have its slot/cake-photo data from
  // the raw row alone); an update just patches the matching card in place.
  // mutate's identity changes with the key (date filter), so the stable
  // Realtime subscription below reads it through a ref.
  const mutateRef = useRef(mutate);
  useEffect(() => {
    mutateRef.current = mutate;
  }, [mutate]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-orders-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, () => {
        mutateRef.current();
      })
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const row = payload.new as RawOrderRow;
          mutateRef.current(
            (current) => {
              if (!current) return current;
              if (row.status === "cancelled") {
                return { orders: current.orders.filter((o) => o.id !== row.id) };
              }
              return {
                orders: current.orders.map((o) => {
                  if (o.id !== row.id) return o;
                  return {
                    ...o,
                    cakeName: row.cake_snapshot?.name ?? o.cakeName,
                    cakeSlug: row.cake_snapshot?.slug ?? o.cakeSlug,
                    total: Number(row.total),
                    depositAmount: Number(row.deposit_amount),
                    balanceDue: Number(row.balance_due),
                    paymentStatus: row.payment_status,
                    status: row.status,
                    fulfilmentType: row.fulfilment_type,
                    contactName: row.contact_name,
                    contactPhone: row.contact_phone,
                    riderName: row.rider_name,
                    riderPhone: row.rider_phone,
                    riderPickupAt: row.rider_pickup_at,
                  };
                }),
              };
            },
            { revalidate: false },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const changeStatus = async (id: string, status: OrderStatus) => {
    try {
      await mutate(
        async () => {
          const res = await fetch(`/api/admin/orders/${id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          if (!res.ok) throw new Error("Failed to save status");
          return undefined;
        },
        {
          optimisticData: (current) => ({ orders: applyStatus(current?.orders ?? [], id, status) }),
          populateCache: false,
          revalidate: false,
          rollbackOnError: true,
        },
      );
    } catch {
      alert("Couldn't save that status change — please try again.");
    }
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
                    <div className="flex items-center justify-end">
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
                        className="relative block h-20 w-full overflow-hidden rounded-lg bg-cream"
                      >
                        <Image
                          src={order.cakeImageUrl}
                          alt=""
                          fill
                          sizes="288px"
                          loading="lazy"
                          className="object-cover"
                        />
                      </a>
                    )}
                    <Link
                      href={`/admin/orders/${order.id}`}
                      draggable={false}
                      className="font-display text-lg font-bold text-brand-chocolate hover:text-brand-orange"
                    >
                      {order.orderNumber}
                    </Link>
                    {order.cakeName !== "Custom cake design" && (
                      <p className="font-body text-xs text-brand-chocolate/60">{order.cakeName}</p>
                    )}
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
                      {NON_CANCEL_ORDER_STATUSES.map((s) => (
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
