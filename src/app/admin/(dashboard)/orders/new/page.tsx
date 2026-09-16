import { listAllCakesAdmin } from "@/lib/admin/catalogAdmin";
import { listZones } from "@/lib/slots/store";
import { getStoreSettings } from "@/lib/settings/store";
import { requireModulePage } from "@/lib/admin/auth";
import { ManualOrderForm } from "@/components/admin/ManualOrderForm";

export default async function NewManualOrderPage() {
  await requireModulePage("new_order");
  const [cakes, zones, settings] = await Promise.all([listAllCakesAdmin(), listZones(), getStoreSettings()]);
  const activeCakes = cakes.filter((c) => c.isActive);

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-brand-chocolate">
        New order
      </h1>
      <p className="mb-6 font-body text-sm text-brand-chocolate/60">
        For orders taken over Facebook Messenger, WhatsApp, or phone.
      </p>
      <ManualOrderForm cakes={activeCakes} zones={zones} depositRate={settings.depositRate} />
    </div>
  );
}
