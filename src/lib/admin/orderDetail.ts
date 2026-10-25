import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { computeDepositAmount, toDepositConfig } from "@/lib/pricing/deposit";
import { getStoreSettings } from "@/lib/settings/store";
import type { OrderStatus } from "@/lib/types/domain";

export type OrderStatusHistoryEntry = {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
  note: string | null;
};

export async function getOrderStatusHistory(orderId: string): Promise<OrderStatusHistoryEntry[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("order_status_history")
    .select("status, note, changed_at, changed_by")
    .eq("order_id", orderId)
    .order("changed_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    status: row.status,
    changedAt: row.changed_at,
    changedBy: row.changed_by,
    note: row.note,
  }));
}

export type OrderEditableFields = {
  contactName: string;
  contactPhone: string;
  deliveryAddressText: string | null;
  kitchenNote: string | null;
  manualTrxId: string | null;
  needsRiderPickup: boolean;
  riderPickupAt: string | null;
  riderName: string | null;
  riderPhone: string | null;
};

export async function updateOrderDetails(orderId: string, patch: OrderEditableFields): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("orders")
    .update({
      contact_name: patch.contactName,
      contact_phone: normalizePhone(patch.contactPhone),
      delivery_address: patch.deliveryAddressText ? { text: patch.deliveryAddressText } : null,
      kitchen_note: patch.kitchenNote,
      manual_trx_id: patch.manualTrxId,
      needs_rider_pickup: patch.needsRiderPickup,
      rider_pickup_at: patch.riderPickupAt,
      rider_name: patch.riderName,
      rider_phone: patch.riderPhone ? normalizePhone(patch.riderPhone) : null,
    })
    .eq("id", orderId);
  if (error) throw error;
}

/** Fills in the cake price, the delivery cost (a custom design has no
 * catalog cake and so no zone-based fee to fall back on — the admin names
 * a number once they know what the delivery actually involves), and,
 * since it's rarely exactly the store's usual percentage/fixed deposit,
 * the actual amount received by bKash/Nagad — all for an order placed
 * with none of them set yet. The public order-form's "Custom design" path
 * (see createPendingCustomDraft()) creates the order right away so it
 * shows up in Live Orders, with the admin filling these in here once
 * they've seen the reference photo, quoted the customer, and confirmed
 * what actually landed in the shop's account. deliveryFee defaults to
 * whatever the order already had (0 for pickup); depositAmount defaults
 * to the store's usual computed deposit when the admin hasn't overridden
 * it, same as every other price path. */
export async function setOrderPrice(
  orderId: string,
  subtotal: number,
  depositAmount?: number,
  deliveryFee?: number,
): Promise<{ paymentStatus: string }> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("delivery_fee, payment_status")
    .eq("id", orderId)
    .single();
  if (fetchError) throw fetchError;

  const resolvedDeliveryFee = deliveryFee ?? Number(existing.delivery_fee);
  const total = subtotal + resolvedDeliveryFee;
  const resolvedDeposit =
    depositAmount ?? computeDepositAmount(total, toDepositConfig(await getStoreSettings()));
  const balanceDue = total - resolvedDeposit;

  const update: Record<string, unknown> = {
    subtotal,
    extras_total: 0,
    delivery_fee: resolvedDeliveryFee,
    total,
    deposit_amount: resolvedDeposit,
    balance_due: balanceDue,
  };
  // Entering a real deposit amount here *is* the admin confirming it
  // actually landed in the shop's account — no need to separately re-verify
  // it in the Payments module too (its "Needs verification" queue only
  // shows paymentStatus === "pending", so this is enough to drop it from
  // there). Never downgrades an order already further along (paid_in_full,
  // refunded, failed) — same guard style as updateOrderStatus()'s
  // auto-settle-on-collection logic in ordersAdmin.ts.
  if (resolvedDeposit > 0 && existing.payment_status === "pending") {
    update.payment_status = "deposit_paid";
  }

  const { error } = await supabase.from("orders").update(update).eq("id", orderId);
  if (error) throw error;

  return { paymentStatus: (update.payment_status as string | undefined) ?? existing.payment_status };
}
