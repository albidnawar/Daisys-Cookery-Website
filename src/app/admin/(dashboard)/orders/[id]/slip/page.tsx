import { notFound } from "next/navigation";
import Image from "next/image";
import { getOrder } from "@/lib/orders/store";
import { resolveCake } from "@/lib/draftOrders/store";
import { formatCakeColor, summarizeSpec } from "@/lib/catalog/specLabels";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { formatSlotLabelForDisplay } from "@/lib/dates";
import { requireModulePage } from "@/lib/admin/auth";
import { PrintButton } from "@/components/admin/PrintButton";

export default async function OrderSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePage("live_orders");
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const cake = order.cakeSnapshot.slug ? await resolveCake(order.cakeSnapshot.slug) : null;
  const groupsByCode = Object.fromEntries((cake?.optionGroups ?? []).map((g) => [g.code, g]));

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-4 flex justify-end print:hidden">
        <PrintButton />
      </div>
      <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-8">
        <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          Daisy&apos;s Cookery &middot; Order Slip
        </p>
        <h1 className="mb-4 font-display text-3xl font-semibold text-brand-chocolate">
          {order.orderNumber}
        </h1>

        <table className="w-full font-body text-sm">
          <tbody>
            <Row label="Customer" value={`${order.contactName} · ${order.contactPhone}`} />
            <Row label="Order source" value={order.orderSource === "manual" ? "FB / Manual" : "Web"} />
            <Row
              label={order.fulfilmentType === "pickup" ? "Pickup" : "Delivery"}
              value={formatSlotLabelForDisplay(order.slotLabel)}
            />
            <Row label="Cake" value={order.cakeSnapshot.name} />
            <Row label="Size" value={order.cakeSnapshot.spec.sizeCode ? `${order.cakeSnapshot.spec.sizeCode} lb` : "-"} />
            <Row
              label="Flavor / spec"
              value={summarizeSpec(groupsByCode, order.cakeSnapshot.spec)}
            />
            <Row label="Board writing" value={order.cakeSnapshot.spec.message || "-"} />
            {formatCakeColor(order.cakeSnapshot.spec.cakeColor) && (
              <Row label="Color" value={formatCakeColor(order.cakeSnapshot.spec.cakeColor)!} />
            )}
            {order.kitchenNote && <Row label="Kitchen note" value={order.kitchenNote} />}
            <Row label="Total" value={`৳${order.total.toLocaleString("en-BD")}`} />
            <Row label="Deposit paid" value={`৳${order.depositAmount.toLocaleString("en-BD")} (${order.paymentMethod})`} />
            <Row
              label="Balance due"
              value={`৳${(order.paymentStatus === "paid_in_full" ? 0 : order.balanceDue).toLocaleString("en-BD")}`}
            />
          </tbody>
        </table>

        {getReferenceImages(order.cakeSnapshot.spec).length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              Reference photo{getReferenceImages(order.cakeSnapshot.spec).length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {getReferenceImages(order.cakeSnapshot.spec).map((url) => (
                <div
                  key={url}
                  className="relative h-40 w-40 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10"
                >
                  <Image src={url} alt="Reference" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-2/5 py-1.5 align-top text-brand-chocolate/60">{label}</td>
      <td className="py-1.5 font-bold text-brand-chocolate">{value}</td>
    </tr>
  );
}
