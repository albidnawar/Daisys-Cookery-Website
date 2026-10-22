import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer/auth";
import { listCustomerOrders } from "@/lib/customer/orders";
import { formatSlotLabelForDisplay } from "@/lib/dates";

export default async function AccountOverviewPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await listCustomerOrders(customer.id);
  const latest = orders[0] ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
        <p className="font-body text-sm text-brand-chocolate/60">Signed in as</p>
        <p className="font-display text-xl font-semibold text-brand-chocolate">
          {customer.displayName ?? customer.email}
        </p>
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
          Latest order
        </h2>
        {latest ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
                {latest.orderNumber}
              </p>
              <p className="font-display text-lg font-semibold text-brand-chocolate">
                {latest.cakeSnapshot.name}
              </p>
              <p className="font-body text-sm text-brand-chocolate/60">
                {formatSlotLabelForDisplay(latest.slotLabel, "Scheduling pending")} &middot; ৳{latest.total.toLocaleString("en-BD")}
              </p>
            </div>
            <Link
              href={`/confirmation/${latest.id}`}
              className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
            >
              View order →
            </Link>
          </div>
        ) : (
          <p className="font-body text-sm text-brand-chocolate/60">
            No orders yet,{" "}
            <Link href="/browse" className="font-bold text-brand-orange hover:text-brand-chocolate">
              browse the cakes
            </Link>{" "}
            to get started.
          </p>
        )}
      </div>
    </div>
  );
}
