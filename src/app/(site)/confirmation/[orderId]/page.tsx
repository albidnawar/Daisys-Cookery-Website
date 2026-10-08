import Link from "next/link";
import Image from "next/image";
import { OrderSummaryCard } from "@/components/confirmation/OrderSummaryCard";
import { getOrder } from "@/lib/orders/store";
import { resolveCake } from "@/lib/draftOrders/store";
import { getStoreSettings } from "@/lib/settings/store";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { toObjectPosition } from "@/lib/image/focal";

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

  const [cake, settings] = await Promise.all([
    order.cakeSnapshot.slug ? resolveCake(order.cakeSnapshot.slug) : null,
    getStoreSettings(),
  ]);
  const groupsByCode = Object.fromEntries((cake?.optionGroups ?? []).map((g) => [g.code, g]));
  const referenceImages = order.cakeSnapshot.slug ? [] : getReferenceImages(order.cakeSnapshot.spec);

  return (
    <div className="mx-auto grid max-w-6xl gap-16 px-4 py-14 sm:px-8 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-center">
      <OrderSummaryCard
        order={order}
        groupsByCode={groupsByCode}
        shopAddress={settings.shopAddress}
        shopPhone={settings.shopPhone}
      />
      {cake?.heroImageUrl ? (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-white">
          <Image
            src={cake.heroImageUrl}
            alt={cake.name}
            fill
            className="object-cover"
            style={{ objectPosition: toObjectPosition(cake.heroImageFocal) }}
          />
        </div>
      ) : referenceImages.length > 0 ? (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-3xl border-2 border-brand-chocolate/10 bg-white">
          <Image src={referenceImages[0]} alt="" fill className="object-cover" />
        </div>
      ) : (
        <div className="aspect-4/3 w-full rounded-3xl border-2 border-brand-chocolate/10 bg-white" />
      )}
    </div>
  );
}
