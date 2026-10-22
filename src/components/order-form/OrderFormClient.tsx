"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FulfilmentTypeCards } from "@/components/buying-options/FulfilmentTypeCards";
import { MonthCalendar } from "@/components/buying-options/MonthCalendar";
import { TimeSlotPicker } from "@/components/buying-options/TimeSlotPicker";
import { ContactFieldsForm, type ContactFields } from "@/components/checkout/ContactFieldsForm";
import { CakeColorField } from "@/components/cake-detail/CakeColorField";
import { RadioOptionGroup, CheckboxOptionGroup } from "@/components/customiser/OptionGroupPicker";
import { ReferenceImageDropzone } from "@/components/customiser/ReferenceImageDropzone";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { todayKey } from "@/lib/dates";
import type { CakeDetail, DeliveryZone, DraftOrderSpec, SlotAvailability } from "@/lib/types/domain";

// The same pricing-placeholder cake the from-scratch customiser
// (/customise/new) uses, see DEFAULT_FROM_SCRATCH_SLUG in
// customise/[slug]/page.tsx. Its option groups (sponge/filling/etc.) give
// the custom-design picker something to render; the draft actually created
// for a custom design is a separate, cake-less one (see
// createPendingCustomDraft()) with no computed price, since a fully custom
// cake can't be priced by calculatePrice(). The admin sets a real price
// from the order detail page once it's placed.
const CUSTOM_DESIGN_SLUG = "the-vanilla-bean";

// Placeholder until a real number is set in .env.local, see
// .env.local.example — same fallback PaymentMethodChooser uses.
const BKASH_NUMBER = process.env.NEXT_PUBLIC_BKASH_NUMBER || "01000000000";

// This public form is custom-design-only. A customer who wants a catalog
// cake already has the full site for that. Keeping it to one path avoids
// duplicating the real checkout flow for no reason here.
export function OrderFormClient({
  zones,
  shopAddress,
  shopHours,
  advanceAmount,
}: {
  zones: DeliveryZone[];
  shopAddress: string;
  shopHours: string;
  /** The flat booking advance (Settings > Custom order advance), charged
   * via bKash before the real price is known — see createOrder()'s
   * isCustomQuote branch in lib/orders/store.ts. */
  advanceAmount: number;
}) {
  const router = useRouter();

  // Cake
  const [cakeDetail, setCakeDetail] = useState<CakeDetail | null>(null);
  const [spec, setSpec] = useState<DraftOrderSpec>({ sizeCode: "1" });
  const [draftId, setDraftId] = useState<string | null>(null);

  // Fulfilment
  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery" | null>(null);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [addressText, setAddressText] = useState("");
  const [date, setDate] = useState(todayKey());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [isLoadingSlots, startLoadingSlots] = useTransition();
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Contact & payment
  const [contact, setContact] = useState<ContactFields>({ name: "", phone: "", kitchenNote: "" });
  const [paymentNumber, setPaymentNumber] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pickupZone = zones.find((z) => z.distanceBand === "pickup") ?? null;
  const deliveryZones = zones.filter((z) => z.distanceBand !== "pickup");
  const effectiveZoneId = fulfilmentType === "pickup" ? pickupZone?.id ?? null : zoneId;

  // Fetch the placeholder cake's option groups for the picker (display
  // only — see CUSTOM_DESIGN_SLUG above), and create a separate cake-less,
  // price-less draft for the actual reference-image upload / spec / order.
  useEffect(() => {
    fetch(`/api/catalog/${CUSTOM_DESIGN_SLUG}`)
      .then((res) => res.json())
      .then((data) => setCakeDetail(data.cake ?? null));
    fetch("/api/draft-order/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customCakeName: "Custom cake design" }),
    })
      .then((res) => res.json())
      .then((data) => setDraftId(data.draft?.id ?? null));
    // Only ever load this once per mount — there's only one cake option now.
  }, []);

  // Debounced spec sync, same pattern as WizardShell.
  useEffect(() => {
    if (!draftId) return;
    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      fetch(`/api/draft-order/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      }).catch(() => {});
    }, 300);
  }, [draftId, spec]);

  useEffect(() => {
    if (!fulfilmentType || !effectiveZoneId) return;
    const params = new URLSearchParams({ date, fulfilmentType, zoneId: effectiveZoneId });
    startLoadingSlots(async () => {
      const res = await fetch(`/api/slots/availability?${params}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    });
  }, [fulfilmentType, effectiveZoneId, date]);

  const groupsByCode = Object.fromEntries((cakeDetail?.optionGroups ?? []).map((g) => [g.code, g]));

  const set = (patch: Partial<DraftOrderSpec>) => setSpec((prev) => ({ ...prev, ...patch }));

  const selectSlot = async (slot: SlotAvailability) => {
    if (!draftId || !fulfilmentType) return;
    setSlotError(null);
    const res = await fetch("/api/slots/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId,
        slotId: slot.slotId,
        fulfilmentType,
        zoneId: effectiveZoneId,
        deliveryAddress: fulfilmentType === "delivery" ? { text: addressText } : null,
      }),
    });
    if (res.status === 409) {
      const data = await res.json().catch(() => ({}));
      const messages: Record<string, string> = {
        date_blocked: "That date isn't available for orders. Please pick another date.",
        daily_cap_reached: "We've reached our production limit for that date. Please pick another date.",
      };
      setSlotError(messages[data.error] ?? "That slot just filled up. Pick another one.");
      return;
    }
    if (!res.ok) {
      setSlotError("Couldn't hold that slot. Try again.");
      return;
    }
    setSelectedSlotId(slot.slotId);
  };

  const canSubmit =
    Boolean(draftId) &&
    Boolean(fulfilmentType) &&
    Boolean(effectiveZoneId) &&
    Boolean(selectedSlotId) &&
    Boolean(contact.name) &&
    Boolean(contact.phone) &&
    (fulfilmentType !== "delivery" || Boolean(addressText.trim())) &&
    getReferenceImages(spec).length > 0 &&
    Boolean(paymentNumber.trim());

  // The real cake price isn't known yet, so there's nothing to take a
  // deposit percentage of. Instead the order form collects a flat booking
  // advance via bKash up front (see Settings > Custom order advance); the
  // server derives the actual amount from its own settings in
  // createOrder() rather than trusting a number from the client, so only
  // the bKash number the customer sent it from travels with the request.
  const handleSubmit = async () => {
    if (!draftId) return;
    setError(null);
    if (!contact.name || !contact.phone) {
      setError("Name and phone are required.");
      return;
    }
    if (getReferenceImages(spec).length === 0) {
      setError("Please upload at least one reference photo.");
      return;
    }
    if (!paymentNumber.trim()) {
      setError("Enter the bKash number you sent the advance from.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          contactName: contact.name,
          contactPhone: contact.phone,
          kitchenNote: contact.kitchenNote,
          paymentMethod: "bkash",
          manualTrxId: paymentNumber.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't submit your order. Try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/confirmation/${data.order.id}`);
    } catch {
      setError("Couldn't submit your order. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">Your cake</h2>

        <p className="mb-4 font-body text-sm text-brand-chocolate/70">
          Upload a reference photo, pick your flavours, and choose your pickup or delivery slot
          below. We&apos;ll confirm your final price once we&apos;ve seen your design.
        </p>

        {cakeDetail && (
          <div className="flex flex-col gap-6">
            <ReferenceImageDropzone
              draftId={draftId}
              imageUrls={getReferenceImages(spec)}
              maxImages={6}
              instructions={spec.instructions}
              onChange={(referenceImageUrls) => set({ referenceImageUrls })}
              onInstructionsChange={(instructions) => set({ instructions })}
            />

            {groupsByCode.size_lb && (
              <label className="block">
                <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                  Size, in pounds
                </span>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={spec.sizeCode ?? ""}
                  onChange={(e) => set({ sizeCode: e.target.value })}
                  placeholder="e.g. 1"
                  className="input-field w-32"
                />
              </label>
            )}

            {groupsByCode.sponge && (
              <RadioOptionGroup group={groupsByCode.sponge} value={spec.sponge} onChange={(sponge) => set({ sponge })} columns={4} />
            )}
            {groupsByCode.filling && (
              <RadioOptionGroup group={groupsByCode.filling} value={spec.filling} onChange={(filling) => set({ filling })} columns={2} />
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
              <CheckboxOptionGroup group={groupsByCode.extras} value={spec.extras ?? []} onChange={(extras) => set({ extras })} />
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                  Message on board
                </span>
                <input
                  value={spec.message ?? ""}
                  onChange={(e) => set({ message: e.target.value })}
                  placeholder="Happy Birthday, Daisy!"
                  className="input-field"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                  Cake color
                </span>
                <CakeColorField value={spec.cakeColor ?? ""} onChange={(cakeColor) => set({ cakeColor })} />
              </label>
            </div>

            <p className="border-t border-brand-chocolate/10 pt-4 font-body text-xs text-brand-chocolate/50">
              We&apos;ll confirm your final price after you submit. A ৳{advanceAmount.toLocaleString("en-BD")} booking advance is required below to hold your slot.
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
          Pickup or delivery
        </h2>
        <FulfilmentTypeCards
          fulfilmentType={fulfilmentType}
          onSelect={(type) => {
            setFulfilmentType(type);
            setSelectedSlotId(null);
          }}
          deliveryZones={deliveryZones}
          zoneId={zoneId}
          onZoneSelect={(z) => {
            setZoneId(z);
            setSelectedSlotId(null);
          }}
          shopAddress={shopAddress}
          shopHours={shopHours}
        />

        {fulfilmentType === "delivery" && (
          <label className="mt-4 block">
            <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              Delivery address
            </span>
            <textarea
              rows={2}
              required
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder="House, road, area"
              className="input-field"
            />
          </label>
        )}

        {fulfilmentType && effectiveZoneId && (
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">Pick a date</h3>
              <MonthCalendar
                selectedDate={date}
                onSelect={(d) => {
                  setDate(d);
                  setSelectedSlotId(null);
                }}
              />
            </div>
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">Time slot</h3>
              <TimeSlotPicker
                slots={slots}
                selectedSlotId={selectedSlotId}
                onSelect={selectSlot}
                loading={isLoadingSlots}
              />
              {slotError && <p className="mt-2 font-body text-xs text-red-600">{slotError}</p>}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <ContactFieldsForm value={contact} onChange={setContact} />
      </section>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
          Booking advance
        </h2>
        <p className="mb-4 font-body text-sm leading-relaxed text-brand-chocolate/80">
          Send <strong>৳{advanceAmount.toLocaleString("en-BD")}</strong> to our bKash number{" "}
          <strong>{BKASH_NUMBER}</strong> (Send Money) to hold your slot, then enter the number
          you sent it from below. This is separate from your final cake price, which we&apos;ll
          confirm once we&apos;ve reviewed your design.
        </p>
        <label className="block">
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Your bKash number
          </span>
          <input
            required
            value={paymentNumber}
            onChange={(e) => setPaymentNumber(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="input-field"
          />
        </label>
      </section>

      <section className="rounded-3xl border-2 border-brand-orange/30 bg-brand-orange/5 p-5 sm:p-6">
        <p className="mb-4 font-body text-sm text-brand-chocolate/70">
          Your ৳{advanceAmount.toLocaleString("en-BD")} advance holds your slot. We&apos;ll confirm
          your final price and remaining deposit once we&apos;ve reviewed your design, then follow
          up on {contact.phone || "your number"}.
        </p>
        {error && <p className="mb-3 font-body text-sm text-red-600">{error}</p>}
        <Button
          variant="primary"
          className="w-full"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? "Submitting…" : "Submit custom order"}
        </Button>
      </section>
    </div>
  );
}
