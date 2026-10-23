import { Card } from "@/components/ui/Card";
import type { DeliveryZone } from "@/lib/types/domain";

const COPY = {
  en: {
    optionOne: "Option one",
    collectFromShop: "Collect from the shop",
    pickupDesc: "Boxed cold and ribboned while you wait.",
    free: "Free",
    selected: "Selected",
    optionTwo: "Option two",
    localDelivery: "Local delivery",
    deliveryDesc:
      "Inside Chattogram city, in a two-hour window. Carried by our own rider in a cold box, handed to a person.",
  },
  bn: {
    optionOne: "অপশন এক",
    collectFromShop: "দোকান থেকে সংগ্রহ করুন",
    pickupDesc: "আপনার অপেক্ষার মধ্যেই ঠান্ডা অবস্থায় বক্স ও রিবন করে দেওয়া হবে।",
    free: "ফ্রি",
    selected: "নির্বাচিত",
    optionTwo: "অপশন দুই",
    localDelivery: "লোকাল ডেলিভারি",
    deliveryDesc:
      "চট্টগ্রাম শহরের ভেতরে, দুই ঘণ্টার সময়সীমায়। আমাদের নিজস্ব রাইডার ঠান্ডা বক্সে করে সরাসরি হাতে পৌঁছে দেবে।",
  },
} as const;

export function FulfilmentTypeCards({
  fulfilmentType,
  onSelect,
  deliveryZones,
  zoneId,
  onZoneSelect,
  shopAddress,
  shopHours,
  locale = "en",
}: {
  fulfilmentType: "pickup" | "delivery" | null;
  onSelect: (type: "pickup" | "delivery") => void;
  deliveryZones: DeliveryZone[];
  zoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
  shopAddress: string;
  shopHours: string;
  locale?: "en" | "bn";
}) {
  const t = COPY[locale];
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card
        className={`cursor-pointer p-6 ${fulfilmentType === "pickup" ? "border-brand-orange" : ""}`}
        onClick={() => onSelect("pickup")}
      >
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          {t.optionOne}
        </span>
        <h3 className="mt-2 font-display text-2xl font-semibold text-brand-chocolate">
          {t.collectFromShop}
        </h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-brand-chocolate/75">
          {shopAddress}. {shopHours}. {t.pickupDesc}
        </p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-display text-xl text-brand-chocolate">{t.free}</span>
          {fulfilmentType === "pickup" && (
            <span className="rounded-full bg-brand-orange/10 px-3 py-1 font-body text-xs font-bold text-brand-orange">
              {t.selected}
            </span>
          )}
        </div>
      </Card>

      <Card
        className={`cursor-pointer p-6 ${fulfilmentType === "delivery" ? "border-brand-orange" : ""}`}
        onClick={() => onSelect("delivery")}
      >
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          {t.optionTwo}
        </span>
        <h3 className="mt-2 font-display text-2xl font-semibold text-brand-chocolate">
          {t.localDelivery}
        </h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-brand-chocolate/75">
          {t.deliveryDesc}
        </p>

        {fulfilmentType === "delivery" && (
          <div
            className="mt-4 flex flex-wrap gap-2 border-t border-brand-chocolate/10 pt-4"
            onClick={(e) => e.stopPropagation()}
          >
            {deliveryZones.map((zone) => (
              <button
                key={zone.id}
                type="button"
                onClick={() => onZoneSelect(zone.id)}
                className={`rounded-full border-2 px-3 py-1.5 font-body text-xs font-bold ${
                  zoneId === zone.id
                    ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                    : "border-brand-chocolate/10 bg-white text-brand-chocolate"
                }`}
              >
                {zone.name}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
