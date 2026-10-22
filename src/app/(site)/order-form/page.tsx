import { OrderFormClient } from "@/components/order-form/OrderFormClient";
import { listZones } from "@/lib/slots/store";
import { getStoreSettings } from "@/lib/settings/store";

// A direct link the shop sends a customer (WhatsApp/FB) so they can place a
// custom-design order themselves without messaging back and forth. One
// page, no admin login needed. Submitting goes through the exact same
// draft-order, slot-hold, and order APIs the normal site checkout uses, so
// slot capacity is never trusted from the client. Catalog cakes aren't
// offered here; a customer who wants one of those already has the full
// site for it, so this link is for custom designs only.
export default async function OrderFormPage() {
  const [zones, settings] = await Promise.all([listZones(), getStoreSettings()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Order form
      </span>
      <h1 className="mb-3 mt-2 font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
        Place your custom order
      </h1>
      <p className="mb-10 max-w-2xl font-body text-base leading-relaxed text-brand-chocolate/75">
        Upload a reference photo, tell us how you want it, and choose a pickup or delivery slot.
        Your request goes straight to our kitchen.
      </p>
      <OrderFormClient
        zones={zones}
        shopAddress={settings.shopAddress}
        shopHours={settings.shopHours}
        advanceAmount={settings.customOrderAdvanceAmount}
      />
    </div>
  );
}
