import { getKitchenBatch } from "@/lib/admin/ordersAdmin";
import { requireModulePage } from "@/lib/admin/auth";
import { KitchenBatchView } from "@/components/admin/KitchenBatchView";
import { todayKey } from "@/lib/dates";

export default async function AdminKitchenPage() {
  await requireModulePage("kitchen_batch");
  const date = todayKey();
  const batch = await getKitchenBatch(date);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Kitchen Batch Sheet
      </h1>
      <KitchenBatchView initialDate={date} initialBatch={batch} />
    </div>
  );
}
