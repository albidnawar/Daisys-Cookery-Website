import { Card } from "@/components/ui/Card";
import type { DeliveryZone } from "@/lib/types/domain";

export function FulfilmentTypeCards({
  fulfilmentType,
  onSelect,
  deliveryZones,
  zoneId,
  onZoneSelect,
  shopAddress,
  shopHours,
}: {
  fulfilmentType: "pickup" | "delivery" | null;
  onSelect: (type: "pickup" | "delivery") => void;
  deliveryZones: DeliveryZone[];
  zoneId: string | null;
  onZoneSelect: (zoneId: string) => void;
  shopAddress: string;
  shopHours: string;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <Card
        className={`cursor-pointer p-6 ${fulfilmentType === "pickup" ? "border-brand-orange" : ""}`}
        onClick={() => onSelect("pickup")}
      >
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          Option one
        </span>
        <h3 className="mt-2 font-display text-2xl font-semibold text-brand-chocolate">
          Collect from the shop
        </h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-brand-chocolate/75">
          {shopAddress}. {shopHours}. Boxed cold and ribboned while you wait.
        </p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="font-display text-xl text-brand-chocolate">Free</span>
          {fulfilmentType === "pickup" && (
            <span className="rounded-full bg-brand-orange/10 px-3 py-1 font-body text-xs font-bold text-brand-orange">
              Selected
            </span>
          )}
        </div>
      </Card>

      <Card
        className={`cursor-pointer p-6 ${fulfilmentType === "delivery" ? "border-brand-orange" : ""}`}
        onClick={() => onSelect("delivery")}
      >
        <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          Option two
        </span>
        <h3 className="mt-2 font-display text-2xl font-semibold text-brand-chocolate">
          Local delivery
        </h3>
        <p className="mt-2 font-body text-sm leading-relaxed text-brand-chocolate/75">
          Inside Chattogram city, in a two-hour window. Carried by our own
          rider in a cold box, handed to a person.
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
