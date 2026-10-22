import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createDraftOrder, updateDraftOrderSpec } from "@/lib/draftOrders/store";
import { formatSlotLabel } from "@/lib/slots/store";
import type { Order } from "@/lib/types/domain";

export class ReorderError extends Error {}

/** Past orders for the signed-in customer, newest first. Goes through the
 * RLS-scoped client (not the service-role one) so this can never leak
 * another customer's orders even if a bug elsewhere widened the query. */
export async function listCustomerOrders(customerId: string): Promise<Order[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "*, delivery_zones ( name ), delivery_slots ( date, start_time, end_time )",
    )
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row: any) => {
    const slot = row.delivery_slots;
    return {
      id: row.id,
      orderNumber: row.order_number,
      customerId: row.customer_id,
      cakeSnapshot: row.cake_snapshot,
      fulfilmentType: row.fulfilment_type,
      zoneId: row.zone_id,
      zoneName: row.delivery_zones?.name ?? null,
      deliveryAddress: row.delivery_address,
      slotId: row.slot_id,
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
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      kitchenNote: row.kitchen_note,
      orderSource: row.order_source ?? "web",
      manualTrxId: row.manual_trx_id ?? null,
      needsRiderPickup: row.needs_rider_pickup ?? false,
      riderPickupAt: row.rider_pickup_at ?? null,
      riderName: row.rider_name ?? null,
      riderPhone: row.rider_phone ?? null,
      createdAt: row.created_at,
    };
  });
}

/** Clones a past order's cake + full spec into a fresh draft so the
 * customer only has to re-pick a delivery/pickup slot, not rebuild the
 * whole cake. Only the frozen snapshot is reused — pricing is recomputed
 * from the live catalog via the normal draft-order flow. */
export async function createReorderDraft(customerId: string, orderId: string): Promise<string> {
  const supabase = await createServerSupabaseClient();
  const { data: order, error } = await supabase
    .from("orders")
    .select("cake_snapshot")
    .eq("id", orderId)
    .eq("customer_id", customerId)
    .maybeSingle();
  if (error) throw error;
  if (!order) throw new ReorderError("Order not found");

  const snapshot = order.cake_snapshot as { slug: string | null; spec: Record<string, unknown> };
  if (!snapshot.slug) {
    throw new ReorderError("This was a fully custom cake. Message us on WhatsApp to reorder it");
  }

  const draft = await createDraftOrder(snapshot.slug);
  await updateDraftOrderSpec(draft.id, snapshot.spec);
  return draft.id;
}
