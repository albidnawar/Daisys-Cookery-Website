import { CustomersCrm } from "@/components/admin/CustomersCrm";
import { listCustomerSummaries } from "@/lib/admin/customersCrm";

export default async function AdminCustomersPage() {
  const customers = await listCustomerSummaries();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">Customers</h1>
      <CustomersCrm customers={customers} />
    </div>
  );
}
