import { RidersManager } from "@/components/admin/RidersManager";
import { listRidersAdmin } from "@/lib/admin/ridersAdmin";
import { requireModulePage } from "@/lib/admin/auth";

export default async function AdminDeliveryRidersPage() {
  await requireModulePage("delivery_riders");

  const riders = await listRidersAdmin();

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate">Delivery Man Details</h1>
      <section>
        <p className="mb-3 font-body text-sm text-brand-chocolate/60">
          Save a rider here once, then pick them from an order&apos;s delivery details instead of
          retyping their number every time.
        </p>
        <RidersManager initialItems={riders} />
      </section>
    </div>
  );
}
