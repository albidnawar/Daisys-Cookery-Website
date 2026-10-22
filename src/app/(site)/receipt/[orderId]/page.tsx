import { notFound } from "next/navigation";
import { getPublicReceipt } from "@/lib/orders/publicReceipt";
import { summarizeSpec } from "@/lib/catalog/specLabels";
import { formatSlotLabelForDisplay } from "@/lib/dates";
import { PAYMENT_STATUS_OPTIONS } from "@/lib/admin/paymentsLedgerTypes";

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bkash: "bKash",
  nagad: "Nagad",
  card: "Card",
  cash_on_collection: "Cash on collection",
};

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <tr>
      <td className="py-1.5 text-brand-chocolate/60">{label}</td>
      <td className={`py-1.5 text-right ${bold ? "font-bold text-brand-chocolate" : "text-brand-chocolate/80"}`}>
        {value}
      </td>
    </tr>
  );
}

// A link the admin copies and sends once an order is priced (see
// setOrderPrice()) — public but unguessable (a real order UUID), showing
// only that one order's own receipt, nothing else about the shop or its
// other customers. Counterpart to /quote/[id] (before an order exists)
// and /confirmation/[orderId] (right after checkout) — this one is for
// "what do I owe, and what's already been paid," reachable any time.
export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const receipt = await getPublicReceipt(orderId);
  if (!receipt) notFound();

  const statusLabel = PAYMENT_STATUS_OPTIONS.find((s) => s.value === receipt.paymentStatus)?.label ?? receipt.paymentStatus;

  return (
    <div className="mx-auto max-w-xl px-4 py-14 sm:px-8">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Receipt
      </span>
      <h1 className="mb-1 mt-2 font-display text-3xl font-semibold text-brand-chocolate sm:text-4xl">
        {receipt.orderNumber}
      </h1>
      <p className="mb-8 font-body text-sm text-brand-chocolate/60">
        Placed {new Date(receipt.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </p>

      <div className="flex flex-col gap-6 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
        <div>
          <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
            Cake
          </p>
          <p className="font-display text-xl font-semibold text-brand-chocolate">{receipt.cakeName}</p>
          <p className="mt-1 font-body text-sm text-brand-chocolate/70">
            {receipt.spec.sizeCode ? `${receipt.spec.sizeCode} lb` : "Size not set"} &middot;{" "}
            {summarizeSpec({}, receipt.spec)}
          </p>
        </div>

        {receipt.slotLabel && (
          <div>
            <p className="mb-1 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
              {receipt.fulfilmentType === "pickup" ? "Pickup" : "Delivery"}
            </p>
            <p className="font-body text-sm text-brand-chocolate/70">{formatSlotLabelForDisplay(receipt.slotLabel)}</p>
          </div>
        )}

        <div>
          <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
            Pricing
          </p>
          {(() => {
            const pricePending = receipt.total === 0 && receipt.depositAmount > 0;
            return (
              <table className="w-full font-body text-sm">
                <tbody>
                  <Row
                    label="Cake price"
                    value={pricePending ? "To be confirmed" : `৳${receipt.subtotal.toLocaleString("en-BD")}`}
                  />
                  {receipt.extrasTotal > 0 && (
                    <Row label="Extras" value={`৳${receipt.extrasTotal.toLocaleString("en-BD")}`} />
                  )}
                  {receipt.fulfilmentType === "delivery" && !pricePending && (
                    <Row label="Delivery" value={`৳${receipt.deliveryFee.toLocaleString("en-BD")}`} />
                  )}
                  {!pricePending && (
                    <Row label="Total" value={`৳${receipt.total.toLocaleString("en-BD")}`} bold />
                  )}
                  <Row
                    label={pricePending ? "Advance paid" : "Deposit"}
                    value={`৳${receipt.depositAmount.toLocaleString("en-BD")} (${PAYMENT_METHOD_LABELS[receipt.paymentMethod] ?? receipt.paymentMethod})`}
                  />
                  <Row
                    label="Due"
                    value={
                      pricePending
                        ? "To be confirmed"
                        : `৳${(receipt.paymentStatus === "paid_in_full" ? 0 : receipt.balanceDue).toLocaleString("en-BD")}`
                    }
                    bold
                  />
                </tbody>
              </table>
            );
          })()}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
          <span className="font-body text-sm text-brand-chocolate/70">Payment status</span>
          <span className="font-body text-sm font-bold text-brand-chocolate">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}
