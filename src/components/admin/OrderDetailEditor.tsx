"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ALL_ORDER_STATUSES } from "@/lib/admin/kanbanColumns";
import { PAYMENT_STATUS_OPTIONS } from "@/lib/admin/paymentsLedgerTypes";
import { summarizeSpec } from "@/lib/catalog/specLabels";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import type { OrderStatusHistoryEntry } from "@/lib/admin/orderDetail";
import type { Order, OptionGroup, OrderStatus, PaymentStatus } from "@/lib/types/domain";

const PAYMENT_METHOD_LABELS: Record<Order["paymentMethod"], string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  cash_on_collection: "Cash on collection",
};

export function OrderDetailEditor({
  order,
  groupsByCode,
  history,
  cakeImageUrl,
}: {
  order: Order;
  groupsByCode: Record<string, OptionGroup>;
  history: OrderStatusHistoryEntry[];
  cakeImageUrl: string | null;
}) {
  const router = useRouter();

  const [contactName, setContactName] = useState(order.contactName);
  const [contactPhone, setContactPhone] = useState(order.contactPhone);
  const [addressText, setAddressText] = useState(
    (order.deliveryAddress as { text?: string } | null)?.text ?? "",
  );
  const [kitchenNote, setKitchenNote] = useState(order.kitchenNote ?? "");
  const [manualTrxId, setManualTrxId] = useState(order.manualTrxId ?? "");
  const [needsRiderPickup, setNeedsRiderPickup] = useState(order.needsRiderPickup);
  const [riderPickupAt, setRiderPickupAt] = useState(
    order.riderPickupAt ? order.riderPickupAt.slice(0, 16) : "",
  );

  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [statusSaving, setStatusSaving] = useState(false);

  const saveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsSaved(false);
    setDetailsError(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactName,
        contactPhone,
        deliveryAddressText: order.fulfilmentType === "delivery" ? addressText || null : null,
        kitchenNote: kitchenNote || null,
        manualTrxId: manualTrxId || null,
        needsRiderPickup,
        riderPickupAt: riderPickupAt ? new Date(riderPickupAt).toISOString() : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDetailsError(data.error ?? "Couldn't save those changes");
      setSavingDetails(false);
      return;
    }
    setDetailsSaved(true);
    setSavingDetails(false);
    router.refresh();
  };

  const changeStatus = async (next: OrderStatus) => {
    setStatus(next);
    setStatusSaving(true);
    await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setStatusSaving(false);
    router.refresh();
  };

  const changePaymentStatus = async (next: PaymentStatus) => {
    setPaymentStatus(next);
    setStatusSaving(true);
    await fetch(`/api/admin/payments/${order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: next }),
    });
    setStatusSaving(false);
    router.refresh();
  };

  const needsTrxId = order.paymentMethod === "bkash" || order.paymentMethod === "nagad";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
            {order.orderSource === "manual" ? "FB / Manual order" : "Web order"} &middot; placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="font-display text-3xl font-semibold text-brand-chocolate">{order.orderNumber}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/admin/orders/${order.id}/slip`}
            target="_blank"
            className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
          >
            Print slip →
          </Link>
          <Link href="/admin/orders" className="font-body text-sm text-brand-chocolate/60 hover:text-brand-orange">
            ← Back to board
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          {/* Cake & spec */}
          <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <p className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              Cake
            </p>
            <p className="font-display text-xl font-semibold text-brand-chocolate">{order.cakeSnapshot.name}</p>
            <p className="mt-1 font-body text-sm text-brand-chocolate/70">
              {order.cakeSnapshot.spec.sizeCode ? `${order.cakeSnapshot.spec.sizeCode} lb` : "Size not set"} &middot;{" "}
              {summarizeSpec(groupsByCode, order.cakeSnapshot.spec)}
            </p>
            {order.cakeSnapshot.spec.message && (
              <p className="mt-2 font-body text-sm text-brand-chocolate/70">
                Board writing: &ldquo;{order.cakeSnapshot.spec.message}&rdquo;
              </p>
            )}
            {order.cakeSnapshot.spec.instructions && (
              <p className="mt-2 font-body text-sm text-brand-chocolate/70">
                Instructions: {order.cakeSnapshot.spec.instructions}
              </p>
            )}
            {cakeImageUrl && (
              <div className="mt-3">
                <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                  Cake photo
                </p>
                <div className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10">
                  <Image src={cakeImageUrl} alt="" fill className="object-cover" />
                </div>
              </div>
            )}
            {getReferenceImages(order.cakeSnapshot.spec).length > 0 && (
              <div className="mt-3">
                <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                  Reference photos from customer
                </p>
                <div className="flex flex-wrap gap-2">
                {getReferenceImages(order.cakeSnapshot.spec).map((url) => (
                  <div
                    key={url}
                    className="relative h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10"
                  >
                    <Image src={url} alt="Reference" fill className="object-cover" />
                  </div>
                ))}
                </div>
              </div>
            )}
          </section>

          {/* Customer & fulfilment — editable */}
          <form onSubmit={saveDetails} className="flex flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              Customer &amp; {order.fulfilmentType === "pickup" ? "pickup" : "delivery"}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input required value={contactName} onChange={(e) => setContactName(e.target.value)} className="input-field" />
              </Field>
              <Field label="Phone">
                <input required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input-field" />
              </Field>
            </div>
            <Field label={order.fulfilmentType === "pickup" ? "Zone" : "Delivery address"}>
              {order.fulfilmentType === "pickup" ? (
                <p className="font-body text-sm text-brand-chocolate/70">{order.zoneName ?? "Shop pickup"}</p>
              ) : (
                <textarea
                  rows={2}
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  className="input-field"
                />
              )}
            </Field>
            <Field label="Slot">
              <p className="font-body text-sm text-brand-chocolate/70">{order.slotLabel ?? "To be confirmed"}</p>
            </Field>
            {order.fulfilmentType === "delivery" && (
              <div className="rounded-2xl border-2 border-brand-chocolate/10 p-3">
                <label className="mb-2 flex items-center gap-2 font-body text-sm text-brand-chocolate">
                  <input
                    type="checkbox"
                    checked={needsRiderPickup}
                    onChange={(e) => setNeedsRiderPickup(e.target.checked)}
                  />
                  Needs a rider to pick this up
                </label>
                {needsRiderPickup && (
                  <Field label="Rider pickup time">
                    <input
                      type="datetime-local"
                      value={riderPickupAt}
                      onChange={(e) => setRiderPickupAt(e.target.value)}
                      className="input-field"
                    />
                  </Field>
                )}
              </div>
            )}
            <Field label="Kitchen note">
              <textarea
                rows={2}
                value={kitchenNote}
                onChange={(e) => setKitchenNote(e.target.value)}
                className="input-field"
              />
            </Field>
            {needsTrxId && (
              <Field label="Payment number">
                <input
                  value={manualTrxId}
                  onChange={(e) => setManualTrxId(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="input-field"
                />
              </Field>
            )}
            {detailsError && <p className="font-body text-sm text-red-600">{detailsError}</p>}
            {detailsSaved && <p className="font-body text-sm text-emerald-700">Saved.</p>}
            <Button type="submit" disabled={savingDetails} className="w-fit">
              {savingDetails ? "Saving…" : "Save changes"}
            </Button>
          </form>

          {/* Pricing */}
          <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <p className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              Pricing
            </p>
            <table className="w-full font-body text-sm">
              <tbody>
                <Row label="Subtotal" value={`৳${order.subtotal.toLocaleString("en-BD")}`} />
                <Row label="Extras" value={`৳${order.extrasTotal.toLocaleString("en-BD")}`} />
                <Row label="Delivery fee" value={`৳${order.deliveryFee.toLocaleString("en-BD")}`} />
                <Row label="Total" value={`৳${order.total.toLocaleString("en-BD")}`} bold />
                <Row label="Deposit" value={`৳${order.depositAmount.toLocaleString("en-BD")} (${PAYMENT_METHOD_LABELS[order.paymentMethod]})`} />
                <Row
                  label="Balance due"
                  value={`৳${(paymentStatus === "paid_in_full" ? 0 : order.balanceDue).toLocaleString("en-BD")}`}
                />
              </tbody>
            </table>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          {/* Status controls */}
          <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <p className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              Status
            </p>
            <label className="mb-4 block">
              <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                Order status
              </span>
              <select
                value={status}
                disabled={statusSaving}
                onChange={(e) => changeStatus(e.target.value as OrderStatus)}
                className="input-field"
              >
                {ALL_ORDER_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                Payment status
              </span>
              <select
                value={paymentStatus}
                disabled={statusSaving}
                onChange={(e) => changePaymentStatus(e.target.value as PaymentStatus)}
                className="input-field"
              >
                {PAYMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          {/* Status history */}
          <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <p className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              History
            </p>
            {history.length === 0 ? (
              <p className="font-body text-sm text-brand-chocolate/60">No status changes recorded.</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {history.map((entry, i) => (
                  <li key={i} className="font-body text-sm">
                    <p className="font-bold text-brand-chocolate">
                      {ALL_ORDER_STATUSES.find((s) => s.value === entry.status)?.label ?? entry.status}
                    </p>
                    <p className="text-xs text-brand-chocolate/50">
                      {new Date(entry.changedAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      &middot; {entry.changedBy}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className="py-1 text-brand-chocolate/60">{label}</td>
      <td className={`py-1 text-right ${bold ? "font-bold text-brand-chocolate" : "text-brand-chocolate/80"}`}>
        {value}
      </td>
    </tr>
  );
}
