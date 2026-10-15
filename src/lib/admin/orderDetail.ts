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
    })
    .eq("id", orderId);
  if (error) throw error;
}

/** Fills in the cake price for an order placed with none yet — the public
 * order-form's "Custom design" path (see createPendingCustomDraft())
 * creates the order right away so it shows up in Live Orders, with the
 * admin setting the real price here once they've seen the reference photo
 * and quoted the customer directly. Recomputes total/deposit/balance the
 * same way every other price path does (delivery fee folded in, deposit
 * from the current store settings), rather than leaving them at zero. */
export async function setOrderPrice(orderId: string, subtotal: number): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("orders")
    .select("delivery_fee")
    .eq("id", orderId)
    .single();
  if (fetchError) throw fetchError;

  const deposit = toDepositConfig(await getStoreSettings());
  const total = subtotal + Number(existing.delivery_fee);
  const depositAmount = computeDepositAmount(total, deposit);
  const balanceDue = total - depositAmount;

  const { error } = await supabase
    .from("orders")
    .update({
      subtotal,
      extras_total: 0,
      total,
      deposit_amount: depositAmount,
      balance_due: balanceDue,
    })
    .eq("id", orderId);
  if (error) throw error;
}
