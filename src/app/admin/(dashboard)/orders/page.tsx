import { listOrdersForKanban } from "@/lib/admin/ordersAdmin";
import { requireModulePage } from "@/lib/admin/auth";
import { OrdersKanban } from "@/components/admin/OrdersKanban";
import { LinkButton } from "@/components/ui/Button";

export default async function AdminOrdersPage() {
  await requireModulePage("live_orders");
  const orders = await listOrdersForKanban();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">Live Orders</h1>
        <LinkButton href="/admin/orders/new" variant="primary">
          + New order
        </LinkButton>
      </div>
      <OrdersKanban initialOrders={orders} />
    </div>
  );
}
