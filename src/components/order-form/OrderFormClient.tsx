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

type Locale = "en" | "bn";

// Static copy owned by this component, in both languages. Shared
// sub-components (ContactFieldsForm, FulfilmentTypeCards, etc.) hold their
// own small bilingual maps and take a `locale` prop instead, since they're
// also used on English-only pages elsewhere on the site.
const COPY = {
  en: {
    eyebrow: "Order form",
    title: "Place your custom order",
    intro: "Upload a reference photo, tell us how you want it, and choose a pickup or delivery slot. Your request goes straight to our kitchen.",
    yourCake: "Your cake",
    yourCakeIntro: "Upload a reference photo, pick your flavours, and choose your pickup or delivery slot below. We'll confirm your final price once we've seen your design.",
    sizeLabel: "Size, in pounds",
    messageLabel: "Message on board",
    messagePlaceholder: "Happy Birthday, Daisy!",
    colorLabel: "Cake color",
    pendingPriceNote: (amount: string) =>
      `We'll confirm your final price after you submit. A ৳${amount} booking advance is required below to hold your slot.`,
    pickupOrDelivery: "Pickup or delivery",
    deliveryAddressLabel: "Delivery address",
    deliveryAddressPlaceholder: "House, road, area",
    pickDate: "Pick a date",
    timeSlot: "Time slot",
    bookingAdvance: "Booking advance",
    bookingAdvanceIntro: (amount: string, number: string) => (
      <>
        Send <strong>৳{amount}</strong> to our bKash number <strong>{number}</strong> (Send Money)
        to hold your slot, then enter the number you sent it from below. This is separate from
        your final cake price, which we&apos;ll confirm once we&apos;ve reviewed your design.
      </>
    ),
    bkashNumberLabel: "Your bKash number",
    bkashNumberPlaceholder: "01XXXXXXXXX",
    confirmNote: (amount: string, phone: string) => (
      <>
        Your ৳{amount} advance holds your slot. We&apos;ll confirm your final price and remaining
        deposit once we&apos;ve reviewed your design, then follow up on {phone}.
      </>
    ),
    yourNumberFallback: "your number",
    submitting: "Submitting…",
    submit: "Submit custom order",
    errNameRequired: "Name and phone are required.",
    errNoPhoto: "Please upload at least one reference photo.",
    errNoBkash: "Enter the bKash number you sent the advance from.",
    errSubmitFailed: "Couldn't submit your order. Try again.",
    errDateBlocked: "That date isn't available for orders. Please pick another date.",
    errDailyCap: "We've reached our production limit for that date. Please pick another date.",
    errSlotFull: "That slot just filled up. Pick another one.",
    errHoldFailed: "Couldn't hold that slot. Try again.",
    toggleTo: "বাংলা",
  },
  bn: {
    eyebrow: "অর্ডার ফর্ম",
    title: "আপনার কাস্টম অর্ডার দিন",
    intro: "একটি রেফারেন্স ছবি আপলোড করুন, আপনি কীভাবে চান তা জানান, এবং পিকআপ বা ডেলিভারির সময় বেছে নিন। আপনার অনুরোধ সরাসরি আমাদের কিচেনে চলে যাবে।",
    yourCake: "আপনার কেক",
    yourCakeIntro: "নিচে একটি রেফারেন্স ছবি আপলোড করুন, আপনার পছন্দের ফ্লেভার বেছে নিন, এবং পিকআপ বা ডেলিভারির সময় নির্বাচন করুন। আপনার ডিজাইন দেখার পর আমরা চূড়ান্ত দাম নিশ্চিত করব।",
    sizeLabel: "সাইজ (পাউন্ডে)",
    messageLabel: "কেকের উপর লেখা",
    messagePlaceholder: "শুভ জন্মদিন, Daisy!",
    colorLabel: "কেকের রঙ",
    pendingPriceNote: (amount: string) =>
      `জমা দেওয়ার পর আমরা আপনার চূড়ান্ত দাম নিশ্চিত করব। আপনার স্লট বুক রাখতে নিচে ৳${amount} বুকিং অগ্রিম প্রয়োজন।`,
    pickupOrDelivery: "পিকআপ অথবা ডেলিভারি",
    deliveryAddressLabel: "ডেলিভারি ঠিকানা",
    deliveryAddressPlaceholder: "বাসা, রোড, এলাকা",
    pickDate: "তারিখ বেছে নিন",
    timeSlot: "সময় বেছে নিন",
    bookingAdvance: "বুকিং অগ্রিম",
    bookingAdvanceIntro: (amount: string, number: string) => (
      <>
        আপনার স্লট বুক রাখতে আমাদের বিকাশ নম্বর <strong>{number}</strong>-এ (Send Money){" "}
        <strong>৳{amount}</strong> পাঠান, এরপর নিচে যে নম্বর থেকে পাঠিয়েছেন তা লিখুন। এটি আপনার
        চূড়ান্ত কেকের দাম থেকে আলাদা, যা আমরা আপনার ডিজাইন দেখার পর নিশ্চিত করব।
      </>
    ),
    bkashNumberLabel: "আপনার বিকাশ নম্বর",
    bkashNumberPlaceholder: "01XXXXXXXXX",
    confirmNote: (amount: string, phone: string) => (
      <>
        আপনার ৳{amount} অগ্রিম আপনার স্লট বুক রাখবে। আমরা আপনার ডিজাইন দেখার পর চূড়ান্ত দাম ও বাকি
        জমার পরিমাণ নিশ্চিত করব, এরপর {phone} নম্বরে যোগাযোগ করব।
      </>
    ),
    yourNumberFallback: "আপনার নম্বরে",
    submitting: "জমা দেওয়া হচ্ছে…",
    submit: "কাস্টম অর্ডার জমা দিন",
    errNameRequired: "নাম এবং ফোন নম্বর আবশ্যক।",
    errNoPhoto: "অনুগ্রহ করে অন্তত একটি রেফারেন্স ছবি আপলোড করুন।",
    errNoBkash: "যে বিকাশ নম্বর থেকে অগ্রিম পাঠিয়েছেন তা লিখুন।",
    errSubmitFailed: "আপনার অর্ডার জমা দেওয়া যায়নি। আবার চেষ্টা করুন।",
    errDateBlocked: "এই তারিখে অর্ডার নেওয়া সম্ভব নয়। অনুগ্রহ করে অন্য একটি তারিখ বেছে নিন।",
    errDailyCap: "এই তারিখের জন্য আমাদের উৎপাদন সীমা শেষ হয়ে গেছে। অনুগ্রহ করে অন্য একটি তারিখ বেছে নিন।",
    errSlotFull: "এই স্লটটি এইমাত্র পূর্ণ হয়ে গেছে। আরেকটি বেছে নিন।",
    errHoldFailed: "স্লটটি বুক করা যায়নি। আবার চেষ্টা করুন।",
    toggleTo: "English",
  },
} as const;

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

  // Bangla is the default since most customers reaching this link are
  // messaged it directly (WhatsApp/FB); they can switch to English anytime.
  const [locale, setLocale] = useState<Locale>("bn");
  const t = COPY[locale];

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
        date_blocked: t.errDateBlocked,
        daily_cap_reached: t.errDailyCap,
      };
      setSlotError(messages[data.error] ?? t.errSlotFull);
      return;
    }
    if (!res.ok) {
      setSlotError(t.errHoldFailed);
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
      setError(t.errNameRequired);
      return;
    }
    if (getReferenceImages(spec).length === 0) {
      setError(t.errNoPhoto);
      return;
    }
    if (!paymentNumber.trim()) {
      setError(t.errNoBkash);
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
        setError(data.error ?? t.errSubmitFailed);
        setSubmitting(false);
        return;
      }
      router.push(`/confirmation/${data.order.id}`);
    } catch {
      setError(t.errSubmitFailed);
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
            {t.eyebrow}
          </span>
          <h1 className="mb-3 mt-2 font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
            {t.title}
          </h1>
          <p className="max-w-2xl font-body text-base leading-relaxed text-brand-chocolate/75">
            {t.intro}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setLocale((l) => (l === "bn" ? "en" : "bn"))}
          className="shrink-0 rounded-full border-2 border-brand-orange px-4 py-1.5 font-body text-sm font-bold text-brand-orange hover:bg-brand-orange/10"
        >
          {t.toggleTo}
        </button>
      </div>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">{t.yourCake}</h2>

        <p className="mb-4 font-body text-sm text-brand-chocolate/70">{t.yourCakeIntro}</p>

        {cakeDetail && (
          <div className="flex flex-col gap-6">
            <ReferenceImageDropzone
              draftId={draftId}
              imageUrls={getReferenceImages(spec)}
              maxImages={6}
              instructions={spec.instructions}
              onChange={(referenceImageUrls) => set({ referenceImageUrls })}
              onInstructionsChange={(instructions) => set({ instructions })}
              locale={locale}
            />

            {groupsByCode.size_lb && (
              <label className="block">
                <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                  {t.sizeLabel}
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
                  {t.messageLabel}
                </span>
                <input
                  value={spec.message ?? ""}
                  onChange={(e) => set({ message: e.target.value })}
                  placeholder={t.messagePlaceholder}
                  className="input-field"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
                  {t.colorLabel}
                </span>
                <CakeColorField value={spec.cakeColor ?? ""} onChange={(cakeColor) => set({ cakeColor })} locale={locale} />
              </label>
            </div>

            <p className="border-t border-brand-chocolate/10 pt-4 font-body text-xs text-brand-chocolate/50">
              {t.pendingPriceNote(advanceAmount.toLocaleString("en-BD"))}
            </p>
          </div>
        )}
      </section>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
          {t.pickupOrDelivery}
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
          locale={locale}
        />

        {fulfilmentType === "delivery" && (
          <label className="mt-4 block">
            <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              {t.deliveryAddressLabel}
            </span>
            <textarea
              rows={2}
              required
              value={addressText}
              onChange={(e) => setAddressText(e.target.value)}
              placeholder={t.deliveryAddressPlaceholder}
              className="input-field"
            />
          </label>
        )}

        {fulfilmentType && effectiveZoneId && (
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">{t.pickDate}</h3>
              <MonthCalendar
                selectedDate={date}
                onSelect={(d) => {
                  setDate(d);
                  setSelectedSlotId(null);
                }}
                locale={locale}
              />
            </div>
            <div>
              <h3 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">{t.timeSlot}</h3>
              <TimeSlotPicker
                slots={slots}
                selectedSlotId={selectedSlotId}
                onSelect={selectSlot}
                loading={isLoadingSlots}
                locale={locale}
              />
              {slotError && <p className="mt-2 font-body text-xs text-red-600">{slotError}</p>}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <ContactFieldsForm value={contact} onChange={setContact} locale={locale} />
      </section>

      <section className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5 sm:p-6">
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
          {t.bookingAdvance}
        </h2>
        <p className="mb-4 font-body text-sm leading-relaxed text-brand-chocolate/80">
          {t.bookingAdvanceIntro(advanceAmount.toLocaleString("en-BD"), BKASH_NUMBER)}
        </p>
        <label className="block">
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            {t.bkashNumberLabel}
          </span>
          <input
            required
            value={paymentNumber}
            onChange={(e) => setPaymentNumber(e.target.value)}
            placeholder={t.bkashNumberPlaceholder}
            className="input-field"
          />
        </label>
      </section>

      <section className="rounded-3xl border-2 border-brand-orange/30 bg-brand-orange/5 p-5 sm:p-6">
        <p className="mb-4 font-body text-sm text-brand-chocolate/70">
          {t.confirmNote(advanceAmount.toLocaleString("en-BD"), contact.phone || t.yourNumberFallback)}
        </p>
        {error && <p className="mb-3 font-body text-sm text-red-600">{error}</p>}
        <Button
          variant="primary"
          className="w-full"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
        >
          {submitting ? t.submitting : t.submit}
        </Button>
      </section>
    </div>
  );
}
