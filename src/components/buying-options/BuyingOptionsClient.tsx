"use client";

import { useState, useTransition } from "react";
import { FulfilmentTypeCards } from "@/components/buying-options/FulfilmentTypeCards";
import { MonthCalendar } from "@/components/buying-options/MonthCalendar";
import { TimeSlotPicker } from "@/components/buying-options/TimeSlotPicker";
import { DepositSummary } from "@/components/buying-options/DepositSummary";
import { withDeliveryFee } from "@/lib/pricing/calculatePrice";
import type { DepositConfig } from "@/lib/pricing/deposit";
import { todayKey } from "@/lib/dates";
import type { DeliveryZone, DraftOrder } from "@/lib/types/domain";

export function BuyingOptionsClient({
  draft,
  zones,
  deposit,
  shopAddress,
  shopHours,
}: {
  draft: DraftOrder;
  zones: DeliveryZone[];
  deposit: DepositConfig;
  shopAddress: string;
  shopHours: string;
}) {
  const pickupZone = zones.find((z) => z.distanceBand === "pickup") ?? null;
  const deliveryZone = zones.find((z) => z.distanceBand !== "pickup") ?? null;

  const [fulfilmentType, setFulfilmentType] = useState<"pickup" | "delivery" | null>(
    draft.fulfilmentType,
  );
  const [date, setDate] = useState(todayKey());
  const [time, setTime] = useState("");
  const [confirmedSlotId, setConfirmedSlotId] = useState<string | null>(draft.slotId);
  const [confirming, startConfirming] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const effectiveZoneId =
    fulfilmentType === "pickup" ? pickupZone?.id ?? null : deliveryZone?.id ?? null;

  const handleConfirmTime = () => {
    setError(null);
    startConfirming(async () => {
      const res = await fetch("/api/slots/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          date,
          startTime: time,
          fulfilmentType,
          zoneId: effectiveZoneId,
        }),
      });
      if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        const messages: Record<string, string> = {
          date_blocked: "That date isn't available for orders. Please pick another date.",
          daily_cap_reached: "We've reached our production limit for that date. Please pick another date.",
        };
        setError(messages[data.error] ?? "Couldn't book that time. Try again.");
        return;
      }
      if (!res.ok) {
        setError("Couldn't hold that time. Try again.");
        return;
      }
      const data = await res.json();
      setConfirmedSlotId(data.hold.slotId);
    });
  };

  const deliveryFee = fulfilmentType === "delivery" ? deliveryZone?.deliveryFee ?? 0 : 0;
  const price = draft.computedPrice
    ? withDeliveryFee(draft.computedPrice, deliveryFee, deposit)
    : null;
  const canContinue = Boolean(fulfilmentType && effectiveZoneId && confirmedSlotId);

  return (
    <div className="flex flex-col gap-8">
      <FulfilmentTypeCards
        fulfilmentType={fulfilmentType}
        onSelect={(type) => {
          setFulfilmentType(type);
          setConfirmedSlotId(null);
        }}
        shopAddress={shopAddress}
        shopHours={shopHours}
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
                  setConfirmedSlotId(null);
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
                  Time
                </h4>
                <TimeSlotPicker
                  fulfilmentType={fulfilmentType}
                  value={time}
                  onChange={(t) => {
                    setTime(t);
                    setConfirmedSlotId(null);
                  }}
                  onConfirm={handleConfirmTime}
                  confirmed={Boolean(confirmedSlotId)}
                  confirming={confirming}
                  error={error}
                />
              </div>
              <hr className="border-brand-chocolate/10" />
              <DepositSummary price={price} draftId={draft.id} canContinue={canContinue} deposit={deposit} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
