import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer/auth";
import { listCustomerOrders } from "@/lib/customer/orders";
import { ReorderButton } from "@/components/account/ReorderButton";

export default async function AccountOrdersPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const orders = await listCustomerOrders(customer.id);

  if (orders.length === 0) {
    return (
      <p className="font-body text-sm text-brand-chocolate/60">
        No orders yet,{" "}
        <Link href="/browse" className="font-bold text-brand-orange hover:text-brand-chocolate">
          browse the cakes
        </Link>{" "}
        to get started.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6"
        >
          <div>
            <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
              {order.orderNumber} &middot; {order.status.replace(/_/g, " ")}
            </p>
            <p className="font-display text-lg font-semibold text-brand-chocolate">
              {order.cakeSnapshot.name}
            </p>
            <p className="font-body text-sm text-brand-chocolate/60">
              {order.slotLabel ?? "Scheduling pending"} &middot; ৳{order.total.toLocaleString("en-BD")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/confirmation/${order.id}`}
              className="font-body text-sm font-bold text-brand-chocolate/70 hover:text-brand-orange"
            >
              View →
            </Link>
            <ReorderButton orderId={order.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
