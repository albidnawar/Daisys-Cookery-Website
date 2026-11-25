"use client";

import { useState } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ALL_ORDER_STATUSES } from "@/lib/admin/kanbanColumns";
import type { OrderManagerRow } from "@/lib/admin/orderManager";
import { jsonFetcher } from "@/lib/swr/fetcher";
import type { OrderStatus } from "@/lib/types/domain";

const PAGE_SIZE = 20;

function formatDate(date: string | null): string {
  if (!date) return "-";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function OrderManagerClient() {
  const [statuses, setStatuses] = useState<Set<OrderStatus>>(new Set());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("received");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteIds, setConfirmDeleteIds] = useState<string[] | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);

  const params = new URLSearchParams();
  if (statuses.size > 0) params.set("statuses", [...statuses].join(","));
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const key = `/api/admin/order-manager?${params.toString()}`;

  const { data, isValidating, mutate } = useSWR<{ orders: OrderManagerRow[] }>(key, jsonFetcher);
  const orders = data?.orders ?? [];

  const pageCount = Math.max(1, Math.ceil(orders.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = orders.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const allOnPageSelected = rows.length > 0 && rows.every((o) => selected.has(o.id));

  function toggleStatus(status: OrderStatus) {
    setStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
    setPage(1);
  }

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllOnPage() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((o) => next.delete(o.id));
      else rows.forEach((o) => next.add(o.id));
      return next;
    });
  }

  async function setOrderStatus(id: string, status: OrderStatus) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/order-manager/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id], status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't update that order");
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that order");
    } finally {
      setBusy(false);
    }
  }

  async function applyBulkStatus() {
    if (selected.size === 0) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/order-manager/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected], status: bulkStatus }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't update those orders");
      setSelected(new Set());
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update those orders");
    } finally {
      setBusy(false);
    }
  }

  async function doDelete(ids: string[]) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/order-manager", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Couldn't delete those orders");
      setSelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete those orders");
    } finally {
      setBusy(false);
    }
  }

  const deleteAllCount = orders.length;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
        <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
          Filter by status
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {ALL_ORDER_STATUSES.map((s) => (
            <label
              key={s.value}
              className={`cursor-pointer rounded-full border px-3 py-1 font-body text-xs font-bold ${
                statuses.has(s.value)
                  ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                  : "border-brand-chocolate/20 text-brand-chocolate/70 hover:border-brand-chocolate/40"
              }`}
            >
              <input
                type="checkbox"
                checked={statuses.has(s.value)}
                onChange={() => toggleStatus(s.value)}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
            Due from
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              className="input-field w-auto"
            />
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
            Due to
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              className="input-field w-auto"
            />
          </label>
          {(from || to) && (
            <button
              type="button"
              onClick={() => {
                setFrom("");
                setTo("");
                setPage(1);
              }}
              className="font-body text-sm font-bold text-brand-orange"
            >
              Clear dates
            </button>
          )}
          {isValidating && <span className="font-body text-xs text-brand-chocolate/50">Loading…</span>}
        </div>
      </div>

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-body text-sm text-brand-chocolate/70">
          {orders.length} order{orders.length === 1 ? "" : "s"} match this filter
          {selected.size > 0 && ` · ${selected.size} selected`}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selected.size > 0 && (
            <>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value as OrderStatus)}
                className="input-field w-auto text-sm"
              >
                {ALL_ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
              <Button type="button" variant="secondary" disabled={busy} onClick={applyBulkStatus}>
                Set status for {selected.size}
              </Button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmDeleteIds([...selected])}
                className="rounded-full border-2 border-red-200 px-4 py-2 font-body text-xs font-bold text-red-600 hover:border-red-400"
              >
                Delete {selected.size} selected
              </button>
            </>
          )}
          {orders.length > 0 && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmDeleteAll(true)}
              className="rounded-full border-2 border-red-200 px-4 py-2 font-body text-xs font-bold text-red-600 hover:border-red-400"
            >
              Delete all {deleteAllCount} matching
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-brand-chocolate/10 bg-white">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-brand-chocolate/10 text-left text-xs uppercase tracking-widest text-brand-chocolate/50">
              <th className="p-3">
                <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
              </th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Cake</th>
              <th className="p-3">Due date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => (
              <tr key={order.id} className="border-b border-brand-chocolate/5 last:border-0">
                <td className="p-3">
                  <input type="checkbox" checked={selected.has(order.id)} onChange={() => toggleRow(order.id)} />
                </td>
                <td className="p-3">
                  <p className="font-bold text-brand-chocolate">{order.orderNumber}</p>
                  <p className="text-xs text-brand-chocolate/50">{order.orderSource}</p>
                </td>
                <td className="p-3 text-brand-chocolate/70">
                  {order.contactName}
                  <br />
                  <span className="text-xs">{order.contactPhone}</span>
                </td>
                <td className="p-3 text-brand-chocolate/70">{order.cakeName}</td>
                <td className="p-3 text-brand-chocolate/70">{formatDate(order.slotDate)}</td>
                <td className="p-3 font-bold text-brand-chocolate">৳{order.total.toLocaleString("en-BD")}</td>
                <td className="p-3">
                  <select
                    value={order.status}
                    disabled={busy}
                    onChange={(e) => setOrderStatus(order.id, e.target.value as OrderStatus)}
                    className="input-field w-auto text-xs"
                  >
                    {ALL_ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmDeleteIds([order.id])}
                    className="font-body text-xs font-bold text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-6 text-center font-body text-sm text-brand-chocolate/60">
            No orders match this filter.
          </p>
        )}
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3">
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

      <ConfirmDialog
        open={confirmDeleteIds !== null}
        message={`Permanently delete ${confirmDeleteIds?.length ?? 0} order${
          (confirmDeleteIds?.length ?? 0) === 1 ? "" : "s"
        }? This removes them completely, including their status history — it cannot be undone.`}
        onConfirm={() => {
          const ids = confirmDeleteIds ?? [];
          setConfirmDeleteIds(null);
          doDelete(ids);
        }}
        onCancel={() => setConfirmDeleteIds(null)}
      />
      <ConfirmDialog
        open={confirmDeleteAll}
        message={`Permanently delete all ${deleteAllCount} orders matching the current filter? This removes them completely, including their status history — it cannot be undone.`}
        onConfirm={() => {
          setConfirmDeleteAll(false);
          doDelete(orders.map((o) => o.id));
        }}
        onCancel={() => setConfirmDeleteAll(false)}
      />
    </div>
  );
}
