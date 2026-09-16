"use client";

import { useEffect, useState, useTransition } from "react";
import { PAYMENT_STATUS_OPTIONS, type DailyFinancialBreakdown, type PaymentLedgerRow } from "@/lib/admin/paymentsLedgerTypes";
import { todayKey } from "@/lib/dates";
import type { PaymentStatus } from "@/lib/types/domain";

const METHOD_LABELS: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  cash_on_collection: "Cash on collection",
};

export function PaymentsLedger({
  initialLedger,
  initialPendingMatches,
  initialBreakdown,
}: {
  initialLedger: PaymentLedgerRow[];
  initialPendingMatches: PaymentLedgerRow[];
  initialBreakdown: DailyFinancialBreakdown;
}) {
  const [dateFilter, setDateFilter] = useState(todayKey());
  const [ledger, setLedger] = useState(initialLedger);
  const [pendingMatches, setPendingMatches] = useState(initialPendingMatches);
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [loading, startLoading] = useTransition();

  const refresh = (date: string) => {
    startLoading(async () => {
      const params = date ? `?date=${date}` : "";
      const res = await fetch(`/api/admin/payments${params}`);
      const data = await res.json();
      setLedger(data.ledger ?? []);
      setPendingMatches(data.pendingMatches ?? []);
      setBreakdown(data.breakdown ?? { collectedMfs: 0, collectedCash: 0, pendingCash: 0, orderCount: 0 });
    });
  };

  useEffect(() => {
    refresh(dateFilter);
  }, [dateFilter]);

  const changeStatus = async (id: string, paymentStatus: PaymentStatus) => {
    await fetch(`/api/admin/payments/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    refresh(dateFilter);
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
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
            All dates
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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
            Collected via bKash/Nagad{dateFilter ? " (this date)" : ""}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand-chocolate">
            ৳{breakdown.collectedMfs.toLocaleString("en-BD")}
          </p>
        </div>
        <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
            Collected in cash{dateFilter ? " (this date)" : ""}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand-chocolate">
            ৳{breakdown.collectedCash.toLocaleString("en-BD")}
          </p>
        </div>
        <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
          <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
            Still outstanding{dateFilter ? " (this date)" : ""}
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-brand-chocolate">
            ৳{breakdown.pendingCash.toLocaleString("en-BD")}
          </p>
        </div>
      </div>

      {pendingMatches.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
            Needs verification ({pendingMatches.length})
          </h2>
          <p className="mb-3 font-body text-xs text-brand-chocolate/60">
            Customer says they&apos;ve paid — check your bKash/Nagad app for a matching transaction ID
            before marking these.
          </p>
          <div className="flex flex-col gap-3">
            {pendingMatches.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-brand-orange/30 bg-brand-orange/5 p-4"
              >
                <div>
                  <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
                    {row.orderNumber} &middot; {METHOD_LABELS[row.paymentMethod]}
                  </p>
                  <p className="font-display text-base font-semibold text-brand-chocolate">
                    {row.contactName} &middot; {row.contactPhone}
                  </p>
                  <p className="font-body text-sm text-brand-chocolate/70">
                    Claimed TrxID: <span className="font-bold">{row.manualTrxId ?? "—"}</span> &middot; ৳
                    {row.depositAmount.toLocaleString("en-BD")} deposit
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => changeStatus(row.id, "deposit_paid")}
                    className="rounded-full bg-brand-orange px-4 py-2 font-body text-xs font-bold text-white hover:bg-brand-chocolate"
                  >
                    ✅ Verified
                  </button>
                  <button
                    type="button"
                    onClick={() => changeStatus(row.id, "failed")}
                    className="rounded-full border-2 border-brand-chocolate/15 px-4 py-2 font-body text-xs font-bold text-brand-chocolate hover:border-red-300 hover:text-red-600"
                  >
                    ❌ Not found
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
          All orders {dateFilter ? "for this date" : ""} ({ledger.length})
        </h2>
        <div className="overflow-x-auto rounded-2xl border-2 border-brand-chocolate/10 bg-white">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-brand-chocolate/10 text-left text-xs uppercase tracking-widest text-brand-chocolate/50">
                <th className="p-3">Order</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Method</th>
                <th className="p-3">TrxID</th>
                <th className="p-3">Total</th>
                <th className="p-3">Deposit</th>
                <th className="p-3">Balance</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {ledger.map((row) => (
                <tr key={row.id} className="border-b border-brand-chocolate/5 last:border-0">
                  <td className="p-3">
                    <p className="font-bold text-brand-chocolate">{row.orderNumber}</p>
                    <p className="text-xs text-brand-chocolate/50">{row.cakeName}</p>
                  </td>
                  <td className="p-3 text-brand-chocolate/70">
                    {row.contactName}
                    <br />
                    <span className="text-xs">{row.contactPhone}</span>
                  </td>
                  <td className="p-3 text-brand-chocolate/70">{METHOD_LABELS[row.paymentMethod]}</td>
                  <td className="p-3 text-brand-chocolate/70">{row.manualTrxId ?? "—"}</td>
                  <td className="p-3 text-brand-chocolate/70">৳{row.total.toLocaleString("en-BD")}</td>
                  <td className="p-3 text-brand-chocolate/70">৳{row.depositAmount.toLocaleString("en-BD")}</td>
                  <td className="p-3 text-brand-chocolate/70">
                    ৳{(row.paymentStatus === "paid_in_full" ? 0 : row.balanceDue).toLocaleString("en-BD")}
                  </td>
                  <td className="p-3">
                    <select
                      value={row.paymentStatus}
                      onChange={(e) => changeStatus(row.id, e.target.value as PaymentStatus)}
                      className="input-field text-xs"
                    >
                      {PAYMENT_STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ledger.length === 0 && (
          <p className="mt-4 font-body text-sm text-brand-chocolate/60">No orders for this date.</p>
        )}
      </div>
    </div>
  );
}
