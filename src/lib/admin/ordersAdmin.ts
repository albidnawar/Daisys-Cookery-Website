import { createServiceRoleClient } from "@/lib/supabase/server";
import { formatSlotLabel } from "@/lib/slots/store";
import { notifyOrderStatusChange } from "@/lib/notifications/notify";
import { getCachedCakeBySlug } from "@/lib/catalog/queries";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { deleteReferenceImageUrls } from "@/lib/storage/referenceImageCleanup";
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
      "id, order_number, cake_snapshot, total, deposit_amount, balance_due, payment_status, status, order_source, fulfilment_type, contact_name, contact_phone, rider_name, rider_phone, delivery_slots ( date, start_time, end_time )",
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

  const uniqueSlugs = [
    ...new Set(
      rows
        .map((row) => (row.cake_snapshot as CakeSnapshot).slug)
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];
  const imageBySlug = new Map<string, string | null>(
    await Promise.all(
      uniqueSlugs.map(
        async (slug) => [slug, (await getCachedCakeBySlug(slug))?.heroImageUrl ?? null] as const,
      ),
    ),
  );

  const kanbanOrders: KanbanOrder[] = rows.map((row) => {
    const slot = row.delivery_slots;
    const cakeSlug = (row.cake_snapshot as CakeSnapshot).slug;
    return {
      id: row.id,
      orderNumber: row.order_number,
      cakeName: (row.cake_snapshot as CakeSnapshot).name,
      cakeSlug,
      cakeImageUrl: cakeSlug ? imageBySlug.get(cakeSlug) ?? null : null,
      spec: (row.cake_snapshot as CakeSnapshot).spec,
      total: Number(row.total),
      depositAmount: Number(row.deposit_amount),
      balanceDue: Number(row.balance_due),
      paymentStatus: row.payment_status,
      status: row.status,
      orderSource: row.order_source,
      fulfilmentType: row.fulfilment_type,
      slotDate: slot?.date ?? null,
      slotStartTime: slot?.start_time ?? null,
      slotLabel: slot ? formatSlotLabel(slot.date, slot.start_time, slot.end_time) : null,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      riderName: row.rider_name ?? null,
      riderPhone: row.rider_phone ?? null,
    };
  });

  // Each column reads top-to-bottom as "what's due soonest" — an order
  // with no slot yet (shouldn't normally happen) sorts to the end rather
  // than before everything else.
  kanbanOrders.sort((a, b) => {
    if (!a.slotDate || !a.slotStartTime) return 1;
    if (!b.slotDate || !b.slotStartTime) return -1;
    const dateCompare = a.slotDate.localeCompare(b.slotDate);
    if (dateCompare !== 0) return dateCompare;
    return a.slotStartTime.localeCompare(b.slotStartTime);
  });

  return kanbanOrders;
}

// A reference photo is only ever useful while the kitchen still has the
// cake to make — once an order lands in one of these, it's either baked
// and gone or never happening, so its reference photo(s) get deleted from
// Storage (see deleteReferenceImageUrls) rather than sitting there forever.
const TERMINAL_STATUSES: OrderStatus[] = ["collected", "delivered", "cancelled"];

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = createServiceRoleClient();
  const update: { status: OrderStatus; payment_status?: "paid_in_full" } = { status };

  const { data: existing } = await supabase
    .from("orders")
    .select("status, payment_status, slot_id, cake_snapshot")
    .eq("id", id)
    .single();

  // Every order — cash-on-collection or a bKash/Nagad deposit — has its
  // remaining balance settled in cash at the door under the 30%-deposit
  // model, so handing over the cake is also the moment the rest gets
  // paid. Auto-settle it here rather than relying on the admin to
  // separately remember to do it in the Payments ledger; they can still
  // override it there afterward if something unusual happened.
  if (status === "collected" || status === "delivered") {
    if (existing && existing.payment_status !== "paid_in_full" && existing.payment_status !== "refunded") {
      update.payment_status = "paid_in_full";
    }
  }

  // Cancelling gives the slot's capacity back — otherwise a cancelled
  // order keeps looking like a real booking forever, inflating "booked
  // today" and eventually blocking a date's daily cap for no reason.
  if (status === "cancelled" && existing && existing.status !== "cancelled") {
    await supabase.rpc("release_slot_capacity", { p_slot_id: existing.slot_id });
  }

  const { error } = await supabase.from("orders").update(update).eq("id", id);
  if (error) throw error;
  await supabase.from("order_status_history").insert({ order_id: id, status, changed_by: "admin" });
  await notifyOrderStatusChange(id, status);

  // Only fires the moment an order first reaches a terminal status, not on
  // every subsequent no-op write (an admin re-saving "cancelled," say) —
  // otherwise this would try (harmlessly, but needlessly) to delete
  // already-deleted files on every later edit to that same order.
  if (existing && TERMINAL_STATUSES.includes(status) && !TERMINAL_STATUSES.includes(existing.status as OrderStatus)) {
    const snapshot = existing.cake_snapshot as CakeSnapshot;
    const urls = getReferenceImages(snapshot.spec);
    if (urls.length > 0) {
      await deleteReferenceImageUrls(urls);
      await supabase
        .from("orders")
        .update({
          cake_snapshot: {
            ...snapshot,
            spec: { ...snapshot.spec, referenceImageUrl: null, referenceImageUrls: [] },
          },
        })
        .eq("id", id);
    }
  }
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
