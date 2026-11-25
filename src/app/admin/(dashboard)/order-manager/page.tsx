import { getCurrentAdmin } from "@/lib/admin/auth";
import { OrderManagerClient } from "@/components/admin/OrderManagerClient";

export default async function OrderManagerPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  if (admin.roleName !== "owner") {
    return (
      <div>
        <h1 className="mb-2 font-display text-3xl font-semibold text-brand-chocolate">Order Manager</h1>
        <p className="font-body text-sm text-brand-chocolate/60">
          Filtering, bulk-editing, and deleting orders is managed by an owner.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-brand-chocolate">Order Manager</h1>
      <p className="mb-6 font-body text-sm text-brand-chocolate/60">
        Find orders by status across any date range, then edit or delete them individually or in bulk.
      </p>
      <OrderManagerClient />
    </div>
  );
}
