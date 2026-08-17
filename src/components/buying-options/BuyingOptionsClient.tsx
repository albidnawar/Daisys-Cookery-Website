"use client";

import { useEffect, useState, useTransition } from "react";
import { FulfilmentTypeCards } from "@/components/buying-options/FulfilmentTypeCards";
import { MonthCalendar } from "@/components/buying-options/MonthCalendar";
import { TimeSlotPicker } from "@/components/buying-options/TimeSlotPicker";
import { DepositSummary } from "@/components/buying-options/DepositSummary";
import { withDeliveryFee } from "@/lib/pricing/calculatePrice";
import { todayKey } from "@/lib/dates";
import type { DeliveryZone, DraftOrder, SlotAvailability } from "@/lib/types/domain";

export function BuyingOptionsClient({
  draft,
  zones,
}: {
  draft: DraftOrder;
  zones: DeliveryZone[];
}) {
  const pickupZone = zones.find((z) => z.distanceBand === "pickup") ?? null;
  const deliveryZones = zones.filter((z) => z.distanceBand !== "pickup");

  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery" | null>(
    draft.fulfilmentType,
  );
  const [zoneId, setZoneId] = useState<string | null>(draft.zoneId);
  const [date, setDate] = useState(todayKey());
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(draft.slotId);
  const [isLoadingSlots, startLoadingSlots] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effectiveZoneId =
    fulfilmentType === "pickup" ? pickupZone?.id ?? null : zoneId;

  useEffect(() => {
    // Nothing to fetch yet; the slot section (and thus TimeSlotPicker)
    // only renders once both are set, so stale slots here are never shown.
    if (!fulfilmentType || !effectiveZoneId) return;

    const params = new URLSearchParams({
      date,
      fulfilmentType,
      zoneId: effectiveZoneId,
    });
    startLoadingSlots(async () => {
      const res = await fetch(`/api/slots/availability?${params}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    });
  }, [fulfilmentType, effectiveZoneId, date]);

  const handleSelectSlot = async (slot: SlotAvailability) => {
    setError(null);
    const res = await fetch("/api/slots/hold", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draftId: draft.id,
        slotId: slot.slotId,
        fulfilmentType,
        zoneId: effectiveZoneId,
      }),
    });
    if (res.status === 409) {
      setError("That slot just filled up — pick another one.");
      const params = new URLSearchParams({ date, fulfilmentType: fulfilmentType!, zoneId: effectiveZoneId! });
      const refreshed = await fetch(`/api/slots/availability?${params}`).then((r) => r.json());
      setSlots(refreshed.slots ?? []);
      return;
    }
    if (!res.ok) {
      setError("Couldn't hold that slot — try again.");
      return;
    }
    setSelectedSlotId(slot.slotId);
  };

  const deliveryFee =
    fulfilmentType === "delivery"
      ? deliveryZones.find((z) => z.id === zoneId)?.deliveryFee ?? 0
      : 0;
  const price = draft.computedPrice
    ? withDeliveryFee(draft.computedPrice, deliveryFee)
    : null;
  const canContinue = Boolean(fulfilmentType && effectiveZoneId && selectedSlotId);

  return (
    <div className="flex flex-col gap-8">
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
      />

      {fulfilmentType && effectiveZoneId && (
        <>
          <hr className="border-brand-chocolate/10" />
          <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
            <div>
              <h4 className="mb-4 font-display text-lg font-semibold text-brand-chocolate">
                Pick a date
              </h4>
              <MonthCalendar
                selectedDate={date}
                onSelect={(d) => {
                  setDate(d);
                  setSelectedSlotId(null);
                }}
              />
              <p className="mt-3 font-body text-xs leading-relaxed text-brand-chocolate/60">
                Same-day orders close at 11am. Tiered and custom cakes need
                48 hours.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <div>
                <h4 className="mb-3 font-display text-lg font-semibold text-brand-chocolate">
                  Time slot
                </h4>
                <TimeSlotPicker
                  slots={slots}
                  selectedSlotId={selectedSlotId}
                  onSelect={handleSelectSlot}
                  loading={isLoadingSlots}
                />
                {error && <p className="mt-2 font-body text-xs text-red-600">{error}</p>}
              </div>
              <hr className="border-brand-chocolate/10" />
              <DepositSummary price={price} draftId={draft.id} canContinue={canContinue} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
