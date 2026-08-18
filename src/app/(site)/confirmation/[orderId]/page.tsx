import Link from "next/link";
import { OrderSummaryCard } from "@/components/confirmation/OrderSummaryCard";
import { getOrder } from "@/lib/orders/store";
import { resolveCake } from "@/lib/draftOrders/store";

export default async function ConfirmationPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-8">
        <h1 className="mb-4 font-display text-3xl font-semibold text-brand-chocolate">
          We can&apos;t find that order
        </h1>
        <Link href="/browse" className="font-body font-bold text-brand-orange hover:text-brand-chocolate">
          Browse the cakes →
        </Link>
      </div>
    );
  }

  const cake = order.cakeSnapshot.slug ? await resolveCake(order.cakeSnapshot.slug) : null;
  const groupsByCode = Object.fromEntries((cake?.optionGroups ?? []).map((g) => [g.code, g]));

  return (
    <div className="mx-auto grid max-w-6xl gap-16 px-4 py-14 sm:px-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center">
      <OrderSummaryCard order={order} groupsByCode={groupsByCode} />
      <div className="aspect-4/3 w-full rounded-3xl border-2 border-brand-chocolate/10 bg-white" />
    </div>
  );
}
