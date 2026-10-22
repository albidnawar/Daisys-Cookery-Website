import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatSlotLabel } from "@/lib/slots/store";
import type { CakeSnapshot, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types/domain";

export type PublicReceipt = {
  orderNumber: string;
  cakeName: string;
  spec: CakeSnapshot["spec"];
  fulfilmentType: "pickup" | "delivery";
  slotLabel: string | null;
  subtotal: number;
  extrasTotal: number;
  deliveryFee: number;
  total: number;
  depositAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  createdAt: string;
};

/** Customer-facing read of an order's receipt — a link the admin can copy
 * and send once the price (and, for a custom design, the delivery cost
 * and deposit) is set. Deliberately excludes contact_name/contact_phone/
 * kitchen_note/manual_trx_id/rider_name/rider_phone/customer_id, none of
 * which the customer needs reflected back at them, and none of which
 * should leak to whoever else holds the link. */
export async function getPublicReceipt(orderId: string): Promise<PublicReceipt | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_number, cake_snapshot, fulfilment_type, subtotal, extras_total, delivery_fee, total, deposit_amount, balance_due, payment_method, payment_status, status, created_at, delivery_slots ( date, start_time, end_time )",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const row = data as any;
  const slot = row.delivery_slots;
  const cakeSnapshot = row.cake_snapshot as CakeSnapshot;

  return {
    orderNumber: row.order_number,
    cakeName: cakeSnapshot.name,
    spec: cakeSnapshot.spec,
    fulfilmentType: row.fulfilment_type,
    slotLabel: slot ? formatSlotLabel(slot.date, slot.start_time, slot.end_time) : null,
    subtotal: Number(row.subtotal),
    extrasTotal: Number(row.extras_total),
    deliveryFee: Number(row.delivery_fee),
    total: Number(row.total),
    depositAmount: Number(row.deposit_amount),
    balanceDue: Number(row.balance_due),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
  };
}
