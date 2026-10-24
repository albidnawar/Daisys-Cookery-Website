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
//
// The header copy lives inside OrderFormClient (a Client Component) rather
// than here, since it needs to react to the Bangla/English toggle, which is
// client-side state a Server Component can't hold.
export default async function OrderFormPage() {
  const [zones, settings] = await Promise.all([listZones(), getStoreSettings()]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
      <OrderFormClient
        zones={zones}
        shopAddress={settings.shopAddress}
        shopHours={settings.shopHours}
      />
    </div>
  );
}
