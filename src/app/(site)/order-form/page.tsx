import { OrderFormClient } from "@/components/order-form/OrderFormClient";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { getCachedCakes } from "@/lib/catalog/queries";
import { FIXTURE_CAKES } from "@/lib/catalog/fixtures";
import { listZones } from "@/lib/slots/store";
import { toDepositConfig } from "@/lib/pricing/deposit";
import { getStoreSettings } from "@/lib/settings/store";

// A direct link the shop sends a customer (WhatsApp/FB) so they can place
// an order themselves without browsing the full site — one page, no admin
// login needed. Submitting goes through the exact same draft-order →
// slot-hold → order APIs as the normal site checkout, so pricing and slot
// capacity are never trusted from the client.
export default async function OrderFormPage() {
  const [cakes, zones, settings] = await Promise.all([
    isSupabaseConfigured() ? getCachedCakes({}) : Promise.resolve(FIXTURE_CAKES),
    listZones(),
    getStoreSettings(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Order form
      </span>
      <h1 className="mb-3 mt-2 font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
        Place your order
      </h1>
      <p className="mb-10 max-w-2xl font-body text-base leading-relaxed text-brand-chocolate/75">
        Pick a cake, tell us how you want it, and choose a pickup or delivery slot — your order
        goes straight to our kitchen.
      </p>
      <OrderFormClient
        cakes={cakes.map((c) => ({ slug: c.slug, name: c.name, basePrice: c.basePrice }))}
        zones={zones}
        deposit={toDepositConfig(settings)}
        shopAddress={settings.shopAddress}
        shopHours={settings.shopHours}
      />
    </div>
  );
}
