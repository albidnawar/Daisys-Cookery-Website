import { Card } from "@/components/ui/Card";

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
      "Home delivery is available within Chattogram city. The delivery charge is set based on the cake's weight (in pounds) and the distance — carried out by our home delivery agent.",
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
      "চট্টগ্রাম সিটিতে হোম ডেলিভারি হবে। সেক্ষেত্রে কেকের পাউন্ড ও দূরত্ব অনুযায়ী ডেলিভারি চার্জ নির্ধারণ করা হয় (হোম ডেলিভারি এজেন্ট করে থাকে)।",
  },
} as const;

export function FulfilmentTypeCards({
  fulfilmentType,
  onSelect,
  shopAddress,
  shopHours,
  locale = "en",
}: {
  fulfilmentType: "pickup" | "delivery" | null;
  onSelect: (type: "pickup" | "delivery") => void;
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
          <div className="mt-4 flex items-baseline justify-between border-t border-brand-chocolate/10 pt-4">
            <span className="rounded-full bg-brand-orange/10 px-3 py-1 font-body text-xs font-bold text-brand-orange">
              {t.selected}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}
