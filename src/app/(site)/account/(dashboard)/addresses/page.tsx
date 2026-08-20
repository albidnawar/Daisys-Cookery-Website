import { getCurrentCustomer } from "@/lib/customer/auth";
import { listAddresses } from "@/lib/customer/addresses";
import { AddressesManager } from "@/components/account/AddressesManager";

export default async function AddressesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const addresses = await listAddresses(customer.id);
  return <AddressesManager addresses={addresses} />;
}
