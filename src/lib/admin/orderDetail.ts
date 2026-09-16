import { createServiceRoleClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
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
    })
    .eq("id", orderId);
  if (error) throw error;
}
