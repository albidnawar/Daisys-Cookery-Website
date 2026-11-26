"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { ImageLightbox } from "@/components/shared/ImageLightbox";
import { ALL_ORDER_STATUSES, NON_CANCEL_ORDER_STATUSES } from "@/lib/admin/kanbanColumns";
import { PAYMENT_STATUS_OPTIONS } from "@/lib/admin/paymentsLedgerTypes";
import { formatCakeColor, summarizeSpec } from "@/lib/catalog/specLabels";
import { formatSlotLabelForDisplay, parseSlotLabel } from "@/lib/dates";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { CakeColorField } from "@/components/cake-detail/CakeColorField";
import { CheckboxOptionGroup } from "@/components/customiser/OptionGroupPicker";
import type { OrderStatusHistoryEntry } from "@/lib/admin/orderDetail";
import type { Rider } from "@/lib/admin/ridersAdmin";
import type { Order, OptionGroup, OptionValue, OrderStatus, PaymentStatus } from "@/lib/types/domain";

const PAYMENT_METHOD_LABELS: Record<Order["paymentMethod"], string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  cash_on_collection: "Cash on collection",
};

// Flavor ("sponge") and Candles & toppers ("extras") are a single global
// option group each (same underlying option_values row set for every
// cake, catalog or custom — see optionValuesAdmin.ts) — groupsByCode only
// has entries for a catalog cake's linked groups, so a custom-design
// order (cake_snapshot.slug === null, which in practice is nearly every
// order) falls back to these fixed, admin-managed labels instead of
// losing the editor entirely.
const FLAVOR_GROUP_LABEL = "Flavor";
const EXTRAS_GROUP_LABEL = "Candles & toppers";

function toOptionGroup(code: string, label: string, values: OptionValue[]): OptionGroup {
  return { id: code, code, label, inputType: "checkbox_multi", minSelect: 0, maxSelect: values.length, values };
}

export function OrderDetailEditor({
  order,
  groupsByCode,
  history,
  cakeImageUrl,
  riders,
  colorOptions,
  flavorOptions,
  extrasOptions,
}: {
  order: Order;
  groupsByCode: Record<string, OptionGroup>;
  history: OrderStatusHistoryEntry[];
  cakeImageUrl: string | null;
  riders: Rider[];
  colorOptions: OptionValue[];
  flavorOptions: OptionValue[];
  extrasOptions: OptionValue[];
}) {
  const router = useRouter();
  const spongeGroup = groupsByCode.sponge ?? toOptionGroup("sponge", FLAVOR_GROUP_LABEL, flavorOptions);
  const extrasGroup = groupsByCode.extras ?? toOptionGroup("extras", EXTRAS_GROUP_LABEL, extrasOptions);

  const [contactName, setContactName] = useState(order.contactName);
  const [contactPhone, setContactPhone] = useState(order.contactPhone);
  const [fulfilmentType, setFulfilmentType] = useState(order.fulfilmentType);
  const [addressText, setAddressText] = useState(
    (order.deliveryAddress as { text?: string } | null)?.text ?? "",
  );
  const [kitchenNote, setKitchenNote] = useState(order.kitchenNote ?? "");
  const [manualTrxId, setManualTrxId] = useState(order.manualTrxId ?? "");
  const [needsRiderPickup, setNeedsRiderPickup] = useState(order.needsRiderPickup);
  const [riderPickupAt, setRiderPickupAt] = useState(
    order.riderPickupAt ? order.riderPickupAt.slice(0, 16) : "",
  );
  const [riderName, setRiderName] = useState(order.riderName ?? "");
  const [riderPhone, setRiderPhone] = useState(order.riderPhone ?? "");

  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSaved, setDetailsSaved] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(order.paymentStatus);
  const [statusSaving, setStatusSaving] = useState(false);

  const [receiptLinkCopied, setReceiptLinkCopied] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const [cakePrice, setCakePrice] = useState(String(order.subtotal));
  const [deliveryCost, setDeliveryCost] = useState(String(order.deliveryFee));
  const [depositReceived, setDepositReceived] = useState(String(order.depositAmount));
  const [savingPrice, setSavingPrice] = useState(false);
  const [priceSaved, setPriceSaved] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  const [cakeName, setCakeName] = useState(order.cakeSnapshot.name);
  const [sizeCode, setSizeCode] = useState(order.cakeSnapshot.spec.sizeCode ?? "");
  const [sponge, setSponge] = useState<string[]>(
    (() => {
      // Legacy orders can still have the pre-multi-select single-string shape.
      const s = order.cakeSnapshot.spec.sponge as string[] | string | undefined;
      if (!s) return [];
      return Array.isArray(s) ? s : [s];
    })(),
  );
  const [extras, setExtras] = useState<string[]>(order.cakeSnapshot.spec.extras ?? []);
  const [message, setMessage] = useState(order.cakeSnapshot.spec.message ?? "");
  const [cakeColor, setCakeColor] = useState<string[]>(
    (() => {
      // Legacy orders can still have the pre-multi-select single-string shape.
      const c = order.cakeSnapshot.spec.cakeColor as string[] | string | undefined;
      if (!c) return [];
      return Array.isArray(c) ? c : [c];
    })(),
  );
  const [instructions, setInstructions] = useState(order.cakeSnapshot.spec.instructions ?? "");
  const [savingCake, setSavingCake] = useState(false);
  const [cakeSaved, setCakeSaved] = useState(false);
  const [cakeError, setCakeError] = useState<string | null>(null);
  const [cakeEditOpen, setCakeEditOpen] = useState(false);

  const [referenceImages, setReferenceImages] = useState<string[]>(
    getReferenceImages(order.cakeSnapshot.spec),
  );
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const resetCakeFields = () => {
    setCakeName(order.cakeSnapshot.name);
    setSizeCode(order.cakeSnapshot.spec.sizeCode ?? "");
    const s = order.cakeSnapshot.spec.sponge as string[] | string | undefined;
    setSponge(!s ? [] : Array.isArray(s) ? s : [s]);
    setExtras(order.cakeSnapshot.spec.extras ?? []);
    setMessage(order.cakeSnapshot.spec.message ?? "");
    const c = order.cakeSnapshot.spec.cakeColor as string[] | string | undefined;
    setCakeColor(!c ? [] : Array.isArray(c) ? c : [c]);
    setInstructions(order.cakeSnapshot.spec.instructions ?? "");
    setCakeError(null);
    setCakeSaved(false);
    setReferenceImages(getReferenceImages(order.cakeSnapshot.spec));
    setPhotoError(null);
  };

  /** Unlike the other cake fields (staged until "Save cake details"),
   * adding/removing a reference photo commits immediately — there's
   * nothing to "undo" by clicking Cancel, the same as every other
   * image-upload control in this admin (ImageUploadField et al). */
  const uploadReferencePhoto = async (file: File) => {
    setPhotoError(null);
    setUploadingPhoto(true);
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(`/api/admin/orders/${order.id}/reference-image`, {
      method: "POST",
      body: form,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPhotoError(data.error ?? "Couldn't upload that photo");
      setUploadingPhoto(false);
      return;
    }
    setReferenceImages((prev) => [...prev, data.url]);
    setUploadingPhoto(false);
    router.refresh();
  };

  const removeReferencePhoto = async (url: string) => {
    setPhotoError(null);
    setRemovingPhoto(url);
    const res = await fetch(`/api/admin/orders/${order.id}/reference-image`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPhotoError(data.error ?? "Couldn't remove that photo");
      setRemovingPhoto(null);
      return;
    }
    setReferenceImages((prev) => prev.filter((u) => u !== url));
    setRemovingPhoto(null);
    router.refresh();
  };

  const openCakeEdit = () => {
    resetCakeFields();
    setCakeEditOpen(true);
  };

  const currentSlot = parseSlotLabel(order.slotLabel);
  const [slotDate, setSlotDate] = useState(currentSlot?.date ?? "");
  const [slotTime, setSlotTime] = useState(currentSlot?.startTime ?? "");
  const [savingSlot, setSavingSlot] = useState(false);
  const [slotSaved, setSlotSaved] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);
  const [slotEditOpen, setSlotEditOpen] = useState(false);

  const openSlotEdit = () => {
    const slot = parseSlotLabel(order.slotLabel);
    setSlotDate(slot?.date ?? "");
    setSlotTime(slot?.startTime ?? "");
    setSlotError(null);
    setSlotSaved(false);
    setSlotEditOpen(true);
  };

  const saveSlot = async () => {
    if (!slotDate || !slotTime) {
      setSlotError("Pick both a date and a time");
      return;
    }
    setSlotError(null);
    setSavingSlot(true);
    setSlotSaved(false);
    const res = await fetch(`/api/admin/orders/${order.id}/slot`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: slotDate, startTime: slotTime }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setSlotError(data.error ?? "Couldn't save that");
      setSavingSlot(false);
      return;
    }
    setSlotSaved(true);
    setSavingSlot(false);
    setSlotEditOpen(false);
    router.refresh();
  };

  const saveCakeDetails = async () => {
    setCakeError(null);
    setSavingCake(true);
    setCakeSaved(false);
    const res = await fetch(`/api/admin/orders/${order.id}/cake`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: order.cakeSnapshot.slug === null ? cakeName : undefined,
        sizeCode: sizeCode || undefined,
        sponge,
        extras,
        message,
        cakeColor,
        instructions,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCakeError(data.error ?? "Couldn't save those changes");
      setSavingCake(false);
      return;
    }
    setCakeSaved(true);
    setSavingCake(false);
    setCakeEditOpen(false);
    router.refresh();
  };

  const saveCakePrice = async () => {
    const subtotal = Number(cakePrice);
    const deliveryFee = Number(deliveryCost);
    const depositAmount = Number(depositReceived);
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      setPriceError("Enter a valid price");
      return;
    }
    if (!Number.isFinite(deliveryFee) || deliveryFee < 0) {
      setPriceError("Enter a valid delivery cost");
      return;
    }
    if (!Number.isFinite(depositAmount) || depositAmount < 0) {
      setPriceError("Enter a valid deposit amount");
      return;
    }
    setPriceError(null);
    setSavingPrice(true);
    setPriceSaved(false);
    const res = await fetch(`/api/admin/orders/${order.id}/price`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtotal, depositAmount, deliveryFee }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setPriceError(data.error ?? "Couldn't save that");
      setSavingPrice(false);
      return;
    }
    if (data.paymentStatus) setPaymentStatus(data.paymentStatus as PaymentStatus);
    setPriceSaved(true);
    setSavingPrice(false);
    router.refresh();
  };

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
        fulfilmentType,
        deliveryAddressText: fulfilmentType === "delivery" ? addressText || null : null,
        kitchenNote: kitchenNote || null,
        manualTrxId: manualTrxId || null,
        needsRiderPickup,
        riderPickupAt: riderPickupAt ? new Date(riderPickupAt).toISOString() : null,
        riderName: riderName.trim() || null,
        riderPhone: riderPhone.trim() || null,
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
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/receipt/${order.id}`);
              setReceiptLinkCopied(true);
              setTimeout(() => setReceiptLinkCopied(false), 2000);
            }}
            className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
          >
            {receiptLinkCopied ? "Copied!" : "Copy receipt link"}
          </button>
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
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                Cake
              </p>
              <button
                type="button"
                onClick={openCakeEdit}
                className="rounded-full border-2 border-brand-orange px-3 py-1 font-body text-xs font-bold text-brand-orange hover:bg-brand-orange/10"
              >
                Edit cake details
              </button>
            </div>
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
            {formatCakeColor(order.cakeSnapshot.spec.cakeColor) && (
              <p className="mt-2 font-body text-sm text-brand-chocolate/70">
                Color: {formatCakeColor(order.cakeSnapshot.spec.cakeColor)}
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
                <button
                  type="button"
                  onClick={() => setLightboxSrc(cakeImageUrl)}
                  className="relative block h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10"
                >
                  <Image src={cakeImageUrl} alt="" fill className="object-cover" />
                </button>
              </div>
            )}
            {getReferenceImages(order.cakeSnapshot.spec).length > 0 && (
              <div className="mt-3">
                <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                  Reference photos from customer
                </p>
                <div className="flex flex-wrap gap-2">
                {getReferenceImages(order.cakeSnapshot.spec).map((url) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setLightboxSrc(url)}
                    className="relative block h-32 w-32 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10"
                  >
                    <Image src={url} alt="Reference" fill className="object-cover" />
                  </button>
                ))}
                </div>
              </div>
            )}
          </section>

          {lightboxSrc && (
            <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
          )}

          {cakeEditOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-brand-chocolate/40 p-4"
              onClick={() => setCakeEditOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-brand-chocolate">Edit cake details</h2>
                  <button
                    type="button"
                    onClick={() => setCakeEditOpen(false)}
                    className="font-body text-sm font-bold text-brand-chocolate/50 hover:text-brand-chocolate"
                  >
                    ✕
                  </button>
                </div>

                {order.cakeSnapshot.slug === null ? (
                  <Field label="Cake name / description">
                    <input value={cakeName} onChange={(e) => setCakeName(e.target.value)} className="input-field" />
                  </Field>
                ) : (
                  <p className="font-display text-lg font-semibold text-brand-chocolate">{order.cakeSnapshot.name}</p>
                )}

                <Field label="Size, in pounds">
                  <input
                    value={sizeCode}
                    onChange={(e) => setSizeCode(e.target.value)}
                    placeholder="e.g. 1"
                    className="input-field w-32"
                  />
                </Field>
                <CheckboxOptionGroup group={spongeGroup} value={sponge} onChange={setSponge} columns={4} />
                <CheckboxOptionGroup group={extrasGroup} value={extras} onChange={setExtras} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Board writing">
                    <input value={message} onChange={(e) => setMessage(e.target.value)} className="input-field" />
                  </Field>
                  <Field label="Cake color">
                    <CakeColorField value={cakeColor} onChange={setCakeColor} colorOptions={colorOptions} />
                  </Field>
                </div>
                <Field label="Instructions">
                  <textarea
                    rows={2}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="input-field"
                  />
                </Field>

                <div>
                  <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                    Reference photos from customer
                  </span>
                  <div className="flex flex-wrap gap-3">
                    {referenceImages.map((url) => (
                      <div
                        key={url}
                        className="relative h-24 w-24 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10"
                      >
                        <button
                          type="button"
                          onClick={() => setLightboxSrc(url)}
                          className="relative block h-full w-full"
                        >
                          <Image src={url} alt="Reference" fill className="object-cover" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeReferencePhoto(url)}
                          disabled={removingPhoto === url}
                          title="Remove photo"
                          className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-brand-chocolate shadow hover:bg-white"
                        >
                          {removingPhoto === url ? "…" : "✕"}
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-dashed border-brand-chocolate/25 bg-cream px-2 text-center font-body text-xs text-brand-chocolate/60"
                    >
                      {uploadingPhoto ? "Uploading…" : "+ Add photo"}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadReferencePhoto(file);
                        e.target.value = "";
                      }}
                    />
                  </div>
                  {photoError && <p className="mt-1 font-body text-sm text-red-600">{photoError}</p>}
                </div>

                {cakeError && <p className="font-body text-sm text-red-600">{cakeError}</p>}
                {cakeSaved && <p className="font-body text-sm text-emerald-700">Saved.</p>}
                <div className="flex gap-3">
                  <Button type="button" disabled={savingCake} onClick={saveCakeDetails} className="w-fit">
                    {savingCake ? "Saving…" : "Save cake details"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setCakeEditOpen(false)} className="w-fit">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {slotEditOpen && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-brand-chocolate/40 p-4"
              onClick={() => setSlotEditOpen(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex w-full max-w-sm flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-xl font-semibold text-brand-chocolate">
                    Edit {order.fulfilmentType === "pickup" ? "pickup" : "delivery"} date &amp; time
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSlotEditOpen(false)}
                    className="font-body text-sm font-bold text-brand-chocolate/50 hover:text-brand-chocolate"
                  >
                    ✕
                  </button>
                </div>
                <Field label="Date">
                  <input
                    type="date"
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="input-field"
                  />
                </Field>
                <Field label="Time">
                  <input
                    type="time"
                    value={slotTime}
                    onChange={(e) => setSlotTime(e.target.value)}
                    className="input-field"
                  />
                </Field>
                {slotError && <p className="font-body text-sm text-red-600">{slotError}</p>}
                {slotSaved && <p className="font-body text-sm text-emerald-700">Saved.</p>}
                <div className="flex gap-3">
                  <Button type="button" disabled={savingSlot} onClick={saveSlot} className="w-fit">
                    {savingSlot ? "Saving…" : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setSlotEditOpen(false)} className="w-fit">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Customer & fulfilment — editable */}
          <form onSubmit={saveDetails} className="flex flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
                Customer &amp; {fulfilmentType === "pickup" ? "pickup" : "delivery"}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFulfilmentType("pickup")}
                  className={`rounded-full border-2 px-3 py-1 font-body text-xs font-bold ${
                    fulfilmentType === "pickup"
                      ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                      : "border-brand-chocolate/10 text-brand-chocolate"
                  }`}
                >
                  Pickup
                </button>
                <button
                  type="button"
                  onClick={() => setFulfilmentType("delivery")}
                  className={`rounded-full border-2 px-3 py-1 font-body text-xs font-bold ${
                    fulfilmentType === "delivery"
                      ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                      : "border-brand-chocolate/10 text-brand-chocolate"
                  }`}
                >
                  Delivery
                </button>
              </div>
            </div>
            {fulfilmentType !== order.fulfilmentType && (
              <p className="font-body text-xs text-brand-orange">
                Changed from {order.fulfilmentType} — remember to update the delivery cost in Pricing below after saving.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name">
                <input required value={contactName} onChange={(e) => setContactName(e.target.value)} className="input-field" />
              </Field>
              <Field label="Phone">
                <input required value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="input-field" />
              </Field>
            </div>
            <Field label={fulfilmentType === "pickup" ? "Zone" : "Delivery address"}>
              {fulfilmentType === "pickup" ? (
                <p className="font-body text-sm text-brand-chocolate/70">
                  {order.fulfilmentType === "pickup" ? order.zoneName ?? "Shop pickup" : "Shop pickup"}
                </p>
              ) : (
                <textarea
                  rows={2}
                  required
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="House, road, area"
                  className="input-field"
                />
              )}
            </Field>
            <Field label="Slot">
              <div className="flex items-center gap-3">
                <p className="font-body text-sm text-brand-chocolate/70">{formatSlotLabelForDisplay(order.slotLabel)}</p>
                <button
                  type="button"
                  onClick={openSlotEdit}
                  className="rounded-full border-2 border-brand-orange px-3 py-1 font-body text-xs font-bold text-brand-orange hover:bg-brand-orange/10"
                >
                  Edit
                </button>
              </div>
            </Field>
            {fulfilmentType === "delivery" && (
              <div className="flex flex-col gap-3 rounded-2xl border-2 border-brand-chocolate/10 p-3">
                {riders.length > 0 && (
                  <Field label="Choose a saved rider">
                    <select
                      defaultValue=""
                      onChange={(e) => {
                        const rider = riders.find((r) => r.id === e.target.value);
                        if (rider) {
                          setRiderName(rider.name);
                          setRiderPhone(rider.phone);
                        }
                        e.target.value = "";
                      }}
                      className="input-field"
                    >
                      <option value="" disabled>
                        Fill name/phone from a saved rider…
                      </option>
                      {riders.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} · {r.phone}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Delivery person name">
                    <input
                      value={riderName}
                      onChange={(e) => setRiderName(e.target.value)}
                      placeholder="Who's delivering this"
                      className="input-field"
                    />
                  </Field>
                  <Field label="Delivery person phone">
                    <input
                      value={riderPhone}
                      onChange={(e) => setRiderPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="input-field"
                    />
                  </Field>
                </div>
                <label className="flex items-center gap-2 font-body text-sm text-brand-chocolate">
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
            {order.cakeSnapshot.slug === null && (
              <div className="mb-4 flex flex-col gap-3 rounded-2xl border-2 border-dashed border-brand-orange/30 bg-brand-orange/5 p-4">
                <Field label="Cake price (customer placed this before a price was set)">
                  <input
                    type="number"
                    min={0}
                    value={cakePrice}
                    onChange={(e) => setCakePrice(e.target.value)}
                    className="input-field"
                  />
                </Field>
                <Field label="Delivery cost (no catalog cake to pull a zone fee from)">
                  <input
                    type="number"
                    min={0}
                    value={deliveryCost}
                    onChange={(e) => setDeliveryCost(e.target.value)}
                    className="input-field"
                  />
                </Field>
                <Field label="Deposit received (actual bKash/Nagad amount, not just the usual %)">
                  <input
                    type="number"
                    min={0}
                    value={depositReceived}
                    onChange={(e) => setDepositReceived(e.target.value)}
                    className="input-field"
                  />
                  <span className="mt-1 block font-body text-xs text-brand-chocolate/50">
                    Entering an amount here marks the deposit verified — no separate step needed in Payments.
                  </span>
                </Field>
                <Button type="button" disabled={savingPrice} onClick={saveCakePrice} className="w-fit">
                  {savingPrice ? "Saving…" : "Save price, delivery & deposit"}
                </Button>
                {priceError && <p className="font-body text-sm text-red-600">{priceError}</p>}
                {priceSaved && <p className="font-body text-sm text-emerald-700">Saved — total and balance updated.</p>}
              </div>
            )}
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
                {/* Cancelling is owner-only, from Order Manager — left out here so it
                    can't be hit by accident, except an already-cancelled order still
                    shows its real status rather than silently falling back to the
                    first option in the list. */}
                {(status === "cancelled" ? ALL_ORDER_STATUSES : NON_CANCEL_ORDER_STATUSES).map((s) => (
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
