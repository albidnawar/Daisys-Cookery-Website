"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import { RadioOptionGroup, CheckboxOptionGroup } from "@/components/customiser/OptionGroupPicker";
import { todayKey } from "@/lib/dates";
import { calculatePrice, withDeliveryFee } from "@/lib/pricing/calculatePrice";
import type { AdminCakeSummary } from "@/lib/admin/catalogAdmin";
import type { CakeDetail, DeliveryZone, DraftOrderSpec, PaymentMethod, PaymentStatus, SlotAvailability } from "@/lib/types/domain";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "card", label: "Card" },
  { value: "cash_on_collection", label: "Cash on collection" },
];
const PAYMENT_STATUSES: { value: PaymentStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "deposit_paid", label: "Deposit paid" },
  { value: "paid_in_full", label: "Paid in full" },
];

export function ManualOrderForm({
  cakes,
  zones,
}: {
  cakes: AdminCakeSummary[];
  zones: DeliveryZone[];
}) {
  // Customer
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [addressText, setAddressText] = useState("");
  const [lookupMessage, setLookupMessage] = useState<string | null>(null);

  // Cake
  const [cakeMode, setCakeMode] = useState<"catalog" | "custom">("catalog");
  const [cakeSlug, setCakeSlug] = useState(cakes[0]?.slug ?? "");
  const [cakeDetail, setCakeDetail] = useState<CakeDetail | null>(null);
  const [customCakeName, setCustomCakeName] = useState("");
  const [spec, setSpec] = useState<DraftOrderSpec>({ sizeCode: "1" });
  const [priceOverride, setPriceOverride] = useState<string>("");

  // Fulfilment
  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery">("pickup");
  const [zoneId, setZoneId] = useState(zones.find((z) => z.distanceBand === "pickup")?.id ?? "");
  const [date, setDate] = useState(todayKey());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [slotId, setSlotId] = useState<string | null>(null);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("pending");
  const [manualTrxId, setManualTrxId] = useState("");
  const [depositOverride, setDepositOverride] = useState<string>("");
  const [kitchenNote, setKitchenNote] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ order: { id: string; orderNumber: string; total: number; depositAmount: number; balanceDue: number } } | null>(null);

  const pickupZone = zones.find((z) => z.distanceBand === "pickup");
  const deliveryZones = zones.filter((z) => z.distanceBand !== "pickup");
  const effectiveZoneId = fulfilmentType === "pickup" ? pickupZone?.id ?? "" : zoneId;

  useEffect(() => {
    if (cakeMode !== "catalog" || !cakeSlug) return;
    fetch(`/api/catalog/${cakeSlug}`)
      .then((res) => res.json())
      .then((data) => setCakeDetail(data.cake ?? null));
  }, [cakeMode, cakeSlug]);

  useEffect(() => {
    if (!effectiveZoneId || !date) return;
    fetch(`/api/slots/availability?date=${date}&fulfilmentType=${fulfilmentType}&zoneId=${effectiveZoneId}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setSlotId(null);
      });
  }, [effectiveZoneId, date, fulfilmentType]);

  const groupsByCode = Object.fromEntries((cakeDetail?.optionGroups ?? []).map((g) => [g.code, g]));

  const cakePrice = cakeDetail ? calculatePrice(cakeDetail, spec) : null;
  const deliveryFee = fulfilmentType === "delivery" ? deliveryZones.find((z) => z.id === zoneId)?.deliveryFee ?? 0 : 0;
  const override = priceOverride ? Number(priceOverride) : null;
  const computedTotal = override != null
    ? override + deliveryFee
    : cakePrice
      ? withDeliveryFee(cakePrice, deliveryFee).total
      : null;
  const computedDeposit = depositOverride ? Number(depositOverride) : computedTotal != null ? Math.round(computedTotal * 0.3) : null;

  const lookupCustomer = async () => {
    if (!phone) return;
    setLookupMessage(null);
    const res = await fetch(`/api/admin/customers/search?phone=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (data.customer) {
      setContactName(data.customer.contactName);
      if (data.customer.deliveryAddress?.text) setAddressText(data.customer.deliveryAddress.text);
      setLookupMessage(`Found ${data.customer.pastOrders.length} past order(s) for this number.`);
    } else {
      setLookupMessage("No past orders found for this number — new customer.");
    }
  };

  const set = (patch: Partial<DraftOrderSpec>) => setSpec((prev) => ({ ...prev, ...patch }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (!slotId) throw new Error("Pick a delivery/collection slot first.");
      const res = await fetch("/api/admin/manual-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cakeSlug: cakeMode === "catalog" ? cakeSlug : null,
          customCakeName: cakeMode === "custom" ? customCakeName : null,
          spec,
          fulfilmentType,
          zoneId: effectiveZoneId,
          slotId,
          deliveryAddress: fulfilmentType === "delivery" ? { text: addressText } : null,
          contactName,
          contactPhone: phone,
          kitchenNote: kitchenNote || null,
          paymentMethod,
          paymentStatus,
          manualTrxId: manualTrxId || null,
          priceOverride: override,
          depositOverride: depositOverride ? Number(depositOverride) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create the order");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the order");
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
      `Daisy's Cookery — Order ${result.order.orderNumber} confirmed!\nTotal: ৳${result.order.total.toLocaleString("en-BD")}\nDeposit: ৳${result.order.depositAmount.toLocaleString("en-BD")}\nBalance: ৳${result.order.balanceDue.toLocaleString("en-BD")}\nThank you!`,
    )}`;
    return (
      <div className="max-w-lg rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
        <p className="mb-2 font-display text-2xl font-semibold text-brand-chocolate">
          Order {result.order.orderNumber} created
        </p>
        <p className="mb-4 font-body text-sm text-brand-chocolate/70">
          Total ৳{result.order.total.toLocaleString("en-BD")} &middot; deposit ৳
          {result.order.depositAmount.toLocaleString("en-BD")}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={waLink} target="_blank" rel="noopener noreferrer">
            <Button variant="primary">Send confirmation on WhatsApp</Button>
          </a>
          <a href={`/admin/orders/${result.order.id}/slip`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary">View / print slip</Button>
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-8">
      <section className="rounded-2xl border-2 border-brand-chocolate/10 p-4">
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">Customer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <div className="flex gap-2">
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01712345678"
                className="input-field"
              />
              <Button type="button" variant="secondary" onClick={lookupCustomer}>
                Look up
              </Button>
            </div>
          </Field>
          <Field label="Name">
            <input
              required
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="input-field"
            />
          </Field>
        </div>
        {lookupMessage && (
          <p className="mt-2 font-body text-xs text-brand-chocolate/60">{lookupMessage}</p>
        )}
      </section>

      <section className="rounded-2xl border-2 border-brand-chocolate/10 p-4">
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">Cake</h2>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setCakeMode("catalog")}
            className={`rounded-full border-2 px-4 py-1.5 font-body text-sm font-bold ${cakeMode === "catalog" ? "border-brand-orange bg-brand-orange/10 text-brand-orange" : "border-brand-chocolate/10 text-brand-chocolate"}`}
          >
            From catalog
          </button>
          <button
            type="button"
            onClick={() => setCakeMode("custom")}
            className={`rounded-full border-2 px-4 py-1.5 font-body text-sm font-bold ${cakeMode === "custom" ? "border-brand-orange bg-brand-orange/10 text-brand-orange" : "border-brand-chocolate/10 text-brand-chocolate"}`}
          >
            Fully custom design
          </button>
        </div>

        {cakeMode === "catalog" ? (
          <>
            <Field label="Cake">
              <select value={cakeSlug} onChange={(e) => setCakeSlug(e.target.value)} className="input-field">
                {cakes.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            {cakeDetail && (
              <div className="mt-4 flex flex-col gap-4">
                {groupsByCode.size_lb && (
                  <RadioOptionGroup
                    group={groupsByCode.size_lb}
                    value={spec.sizeCode}
                    onChange={(sizeCode) => set({ sizeCode })}
                    columns={4}
                  />
                )}
                {groupsByCode.sponge && (
                  <RadioOptionGroup
                    group={groupsByCode.sponge}
                    value={spec.sponge}
                    onChange={(sponge) => set({ sponge })}
                    columns={4}
                  />
                )}
                {groupsByCode.filling && (
                  <RadioOptionGroup
                    group={groupsByCode.filling}
                    value={spec.filling}
                    onChange={(filling) => set({ filling })}
                    columns={2}
                  />
                )}
                {groupsByCode.frosting_finish && (
                  <RadioOptionGroup
                    group={groupsByCode.frosting_finish}
                    value={spec.frostingFinish}
                    onChange={(frostingFinish) => set({ frostingFinish })}
                    columns={2}
                  />
                )}
                {groupsByCode.extras && (
                  <CheckboxOptionGroup
                    group={groupsByCode.extras}
                    value={spec.extras ?? []}
                    onChange={(extras) => set({ extras })}
                  />
                )}
              </div>
            )}
          </>
        ) : (
          <Field label="Custom cake name/description">
            <input
              required
              value={customCakeName}
              onChange={(e) => setCustomCakeName(e.target.value)}
              placeholder="e.g. 3-tier fondant unicorn cake"
              className="input-field"
            />
          </Field>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Message on board">
            <input
              value={spec.message ?? ""}
              onChange={(e) => set({ message: e.target.value })}
              className="input-field"
            />
          </Field>
          <Field label={cakeMode === "custom" || spec.sizeCode === "other" ? "Price (required)" : "Price override (optional)"}>
            <input
              type="number"
              value={priceOverride}
              onChange={(e) => setPriceOverride(e.target.value)}
              placeholder={cakePrice ? String(cakePrice.subtotal) : "৳"}
              className="input-field"
            />
          </Field>
        </div>

        <div className="mt-4">
          <ImageUploadField
            label="Reference photo (from FB chat)"
            value={spec.referenceImageUrl}
            onChange={(url) => set({ referenceImageUrl: url })}
          />
        </div>
      </section>

      <section className="rounded-2xl border-2 border-brand-chocolate/10 p-4">
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
          Pickup or delivery
        </h2>
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setFulfilmentType("pickup")}
            className={`rounded-full border-2 px-4 py-1.5 font-body text-sm font-bold ${fulfilmentType === "pickup" ? "border-brand-orange bg-brand-orange/10 text-brand-orange" : "border-brand-chocolate/10 text-brand-chocolate"}`}
          >
            Pickup
          </button>
          <button
            type="button"
            onClick={() => setFulfilmentType("delivery")}
            className={`rounded-full border-2 px-4 py-1.5 font-body text-sm font-bold ${fulfilmentType === "delivery" ? "border-brand-orange bg-brand-orange/10 text-brand-orange" : "border-brand-chocolate/10 text-brand-chocolate"}`}
          >
            Delivery
          </button>
        </div>

        {fulfilmentType === "delivery" && (
          <>
            <Field label="Zone">
              <select value={zoneId} onChange={(e) => setZoneId(e.target.value)} className="input-field">
                {deliveryZones.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.name} · ৳{z.deliveryFee}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Delivery address">
              <textarea
                required
                rows={2}
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                className="input-field mt-2"
              />
            </Field>
          </>
        )}

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Date">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </Field>
          <Field label="Slot">
            <select
              value={slotId ?? ""}
              onChange={(e) => setSlotId(e.target.value)}
              className="input-field"
            >
              <option value="" disabled>
                Choose a slot
              </option>
              {slots.map((s) => (
                <option key={s.slotId} value={s.slotId} disabled={s.status === "full"}>
                  {s.startTime}–{s.endTime} ({s.status === "full" ? "full" : `${s.remaining} left`})
                </option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-brand-chocolate/10 p-4">
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">Payment</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Method">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="input-field"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
              className="input-field"
            >
              {PAYMENT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          {paymentMethod !== "cash_on_collection" && (
            <Field label="MFS Transaction ID (if verified)">
              <input
                value={manualTrxId}
                onChange={(e) => setManualTrxId(e.target.value)}
                className="input-field"
              />
            </Field>
          )}
          <Field label="Deposit due now (defaults to 30%)">
            <input
              type="number"
              value={depositOverride}
              onChange={(e) => setDepositOverride(e.target.value)}
              placeholder={computedTotal != null ? String(Math.round(computedTotal * 0.3)) : ""}
              className="input-field"
            />
          </Field>
        </div>
        <Field label="Note for the kitchen">
          <textarea
            rows={2}
            value={kitchenNote}
            onChange={(e) => setKitchenNote(e.target.value)}
            className="input-field mt-2"
          />
        </Field>
      </section>

      {computedTotal != null && (
        <div className="rounded-2xl border-2 border-brand-orange/30 bg-brand-orange/5 p-4">
          <p className="font-body text-sm text-brand-chocolate">
            Total: <strong>৳{computedTotal.toLocaleString("en-BD")}</strong> &middot; Deposit due
            now: <strong>৳{(computedDeposit ?? 0).toLocaleString("en-BD")}</strong>
          </p>
        </div>
      )}

      {error && <p className="font-body text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Creating order…" : "Create order"}
      </Button>
    </form>
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
