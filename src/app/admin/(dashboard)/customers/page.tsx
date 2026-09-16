import { CustomersCrm } from "@/components/admin/CustomersCrm";
import { listCustomerSummaries } from "@/lib/admin/customersCrm";
import { requireModulePage } from "@/lib/admin/auth";

export default async function AdminCustomersPage() {
  await requireModulePage("customers");
  const customers = await listCustomerSummaries();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">Customers</h1>
      <CustomersCrm customers={customers} />
    </div>
  );
}
