import { DateCapacityManager } from "@/components/admin/DateCapacityManager";
import { DeliveryManifest } from "@/components/admin/DeliveryManifest";
import { listDateCapacityRows, listManifestForDate } from "@/lib/admin/logistics";
import { ensureSlotsGenerated } from "@/lib/slots/generate";
import { requireModulePage } from "@/lib/admin/auth";
import { todayKey, toDateKey } from "@/lib/dates";

export default async function AdminLogisticsPage() {
  await requireModulePage("logistics");
  await ensureSlotsGenerated();

  const today = todayKey();
  const end = new Date();
  end.setDate(end.getDate() + 29);
  const endDate = toDateKey(end);

  const [capacityRows, manifestRows] = await Promise.all([
    listDateCapacityRows(today, endDate),
    listManifestForDate(today),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
        Capacity &amp; delivery logistics
      </h1>
      <DeliveryManifest initialDate={today} initialRows={manifestRows} />
      <DateCapacityManager initialRows={capacityRows} />
    </div>
  );
}
