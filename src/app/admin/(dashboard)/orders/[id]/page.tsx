import { notFound } from "next/navigation";
import { getOrder } from "@/lib/orders/store";
import { resolveCake } from "@/lib/draftOrders/store";
import { getOrderStatusHistory } from "@/lib/admin/orderDetail";
import { requireModulePage } from "@/lib/admin/auth";
import { OrderDetailEditor } from "@/components/admin/OrderDetailEditor";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePage("live_orders");
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const [cake, history] = await Promise.all([
    order.cakeSnapshot.slug ? resolveCake(order.cakeSnapshot.slug) : null,
    getOrderStatusHistory(id),
  ]);
  const groupsByCode = Object.fromEntries((cake?.optionGroups ?? []).map((g) => [g.code, g]));

  return (
    <OrderDetailEditor
      order={order}
      groupsByCode={groupsByCode}
      history={history}
      cakeImageUrl={cake?.heroImageUrl ?? null}
    />
  );
}
