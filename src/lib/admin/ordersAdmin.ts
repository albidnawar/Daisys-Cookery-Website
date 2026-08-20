import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatSlotLabel } from "@/lib/slots/store";
import { notifyOrderStatusChange } from "@/lib/notifications/notify";
import type { KanbanOrder } from "@/lib/admin/kanbanColumns";
import type { CakeSnapshot, OrderStatus } from "@/lib/types/domain";

// KANBAN_COLUMNS and the KanbanOrder type live in kanbanColumns.ts, a
// module with zero server-only imports — OrdersKanban.tsx (a Client
// Component) needs them, and importing anything from *this* file would
// pull the service-role Supabase client (and its secret key) into the
// client bundle.
export type { KanbanOrder } from "@/lib/admin/kanbanColumns";

export async function listOrdersForKanban(date?: string): Promise<KanbanOrder[]> {
  const supabase = createServiceRoleClient();
  const query = supabase
    .from("orders")
    .select(
      "id, order_number, cake_snapshot, total, deposit_amount, balance_due, payment_status, status, order_source, fulfilment_type, contact_name, contact_phone, delivery_slots ( date, start_time, end_time )",
    )
    .neq("status", "cancelled")
    .order("created_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rows = data as any[];
  if (date) {
    rows = rows.filter((row) => row.delivery_slots?.date === date);
  }

  return rows.map((row) => {
    const slot = row.delivery_slots;
    return {
      id: row.id,
      orderNumber: row.order_number,
      cakeName: (row.cake_snapshot as CakeSnapshot).name,
      spec: (row.cake_snapshot as CakeSnapshot).spec,
      total: Number(row.total),
      depositAmount: Number(row.deposit_amount),
      balanceDue: Number(row.balance_due),
      paymentStatus: row.payment_status,
      status: row.status,
      orderSource: row.order_source,
      fulfilmentType: row.fulfilment_type,
      slotDate: slot?.date ?? null,
      slotLabel: slot ? formatSlotLabel(slot.date, slot.start_time, slot.end_time) : null,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
    };
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = createServiceRoleClient();
  const update: { status: OrderStatus; payment_status?: "paid_in_full" } = { status };

  // Every order — cash-on-collection or a bKash/Nagad deposit — has its
  // remaining balance settled in cash at the door under the 30%-deposit
  // model, so handing over the cake is also the moment the rest gets
  // paid. Auto-settle it here rather than relying on the admin to
  // separately remember to do it in the Payments ledger; they can still
  // override it there afterward if something unusual happened.
  if (status === "collected" || status === "delivered") {
    const { data: existing } = await supabase.from("orders").select("payment_status").eq("id", id).single();
    if (existing && existing.payment_status !== "paid_in_full" && existing.payment_status !== "refunded") {
      update.payment_status = "paid_in_full";
    }
  }

  // Cancelling gives the slot's capacity back — otherwise a cancelled
  // order keeps looking like a real booking forever, inflating "booked
  // today" and eventually blocking a date's daily cap for no reason.
  if (status === "cancelled") {
    const { data: existing } = await supabase.from("orders").select("slot_id, status").eq("id", id).single();
    if (existing && existing.status !== "cancelled") {
      await supabase.rpc("release_slot_capacity", { p_slot_id: existing.slot_id });
    }
  }

  const { error } = await supabase.from("orders").update(update).eq("id", id);
  if (error) throw error;
  await supabase.from("order_status_history").insert({ order_id: id, status, changed_by: "admin" });
  await notifyOrderStatusChange(id, status);
}

export type KitchenBatchLine = {
  cakeName: string;
  sizeLb: string;
  sponge: string | null;
  count: number;
};

/** "Today's Batch: 5x 1lb Chocolate Fudge, 3x 2lb Red Velvet…" — groups
 * every non-cancelled order for a date by cake+size+sponge. */
export async function getKitchenBatch(date: string): Promise<KitchenBatchLine[]> {
  const orders = await listOrdersForKanban(date);
  const groups = new Map<string, KitchenBatchLine>();

  for (const order of orders) {
    const sizeLb = order.spec.sizeCode ?? "?";
    const sponge = order.spec.sponge ?? null;
    const key = `${order.cakeName}::${sizeLb}::${sponge ?? ""}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { cakeName: order.cakeName, sizeLb, sponge, count: 1 });
    }
  }

  return [...groups.values()].sort((a, b) => b.count - a.count);
}
