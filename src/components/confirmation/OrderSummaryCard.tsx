import { LinkButton } from "@/components/ui/Button";
import { AddToCalendarButton } from "@/components/confirmation/AddToCalendarButton";
import { summarizeSpec } from "@/lib/catalog/specLabels";
import type { Order, OptionGroup } from "@/lib/types/domain";

function formatSlotLabel(slotLabel: string | null): string {
  if (!slotLabel) return "To be confirmed";
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(slotLabel);
  if (!match) return slotLabel;
  const [, date, start, end] = match;
  const formatted = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return `${formatted}, ${start}–${end}`;
}

const PAYMENT_METHOD_LABELS: Record<Order["paymentMethod"], string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  cash_on_collection: "Cash on collection",
};

export function OrderSummaryCard({
  order,
  groupsByCode,
}: {
  order: Order;
  groupsByCode: Record<string, OptionGroup>;
}) {
  const collectOrDeliver = order.fulfilmentType === "pickup" ? "Collect" : "Delivered";
  const fromOrTo =
    order.fulfilmentType === "pickup"
      ? "Flat D3, House - 176, Sanmar Santino, Devpahar, College Road, Chattogram"
      : (order.zoneName ?? "your address");

  return (
    <div className="flex flex-col gap-4">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Order {order.orderNumber} &middot; placed{" "}
        {new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}
      </span>
      <h1 className="font-display text-5xl font-semibold leading-tight text-brand-chocolate sm:text-6xl">
        Thank you. We are baking.
      </h1>
      <p className="max-w-lg font-body text-base leading-relaxed text-brand-chocolate/80">
        Your deposit is in and the date is held. We will message you when
        your cake goes in the oven, and again when it&apos;s ready.
      </p>
      <hr className="border-brand-chocolate/10" />
      <table className="w-full font-body text-sm">
        <tbody>
          <Row label={collectOrDeliver} value={formatSlotLabel(order.slotLabel)} />
          <Row label={order.fulfilmentType === "pickup" ? "From" : "To"} value={fromOrTo} />
          <Row
            label="Cake"
            value={`${order.cakeSnapshot.name} — ${order.cakeSnapshot.spec.sizeCode ?? "?"} lb, ${summarizeSpec(groupsByCode, order.cakeSnapshot.spec)}`}
          />
          <Row
            label="Deposit paid"
            value={`৳${order.depositAmount.toLocaleString("en-BD")} by ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`}
          />
          <Row
            label={order.fulfilmentType === "pickup" ? "Balance at collection" : "Balance on delivery"}
            value={`৳${order.balanceDue.toLocaleString("en-BD")}`}
          />
        </tbody>
      </table>
      <div className="mt-2 flex flex-wrap gap-3">
        <LinkButton href={`/account/orders/${order.id}`} variant="primary">
          View the order
        </LinkButton>
        <AddToCalendarButton
          orderNumber={order.orderNumber}
          summary={`Daisy's Cookery — ${order.cakeSnapshot.name}`}
          location={fromOrTo}
          slotLabel={order.slotLabel}
        />
      </div>
      <p className="font-body text-xs text-brand-chocolate/60">
        Change something? Call the shop on 01814438989 up to 24 hours
        before your slot.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="w-2/5 py-1.5 align-top text-brand-chocolate/60">{label}</td>
      <td className="py-1.5 text-brand-chocolate">{value}</td>
    </tr>
  );
}
