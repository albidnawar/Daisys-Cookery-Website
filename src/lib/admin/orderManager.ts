import { createServiceRoleClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "@/lib/admin/ordersAdmin";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { deleteReferenceImageUrls } from "@/lib/storage/referenceImageCleanup";
import type { CakeSnapshot, OrderStatus } from "@/lib/types/domain";

export type OrderManagerRow = {
  id: string;
  orderNumber: string;
  contactName: string;
  contactPhone: string;
  total: number;
  status: OrderStatus;
  orderSource: "web" | "manual";
  slotDate: string | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
  createdAt: string;
};

export type OrderManagerFilter = {
  statuses?: OrderStatus[];
  from?: string;
  to?: string;
};

// This is an owner-only bulk-admin tool, not a paginated customer-facing
// list — a generous cap rather than the Kanban board's unfiltered-view
// limit, since "all dates, every status" is the whole point of this page.
const LIST_LIMIT = 1000;

/** Every order matching the given status(es)/date range, across all
 * dates — unlike listOrdersForKanban() (which defaults to "today" and
 * always excludes cancelled), this is meant for finding and bulk-managing
 * orders by their current state regardless of when they're due. */
export async function listOrdersForManager(filter: OrderManagerFilter): Promise<OrderManagerRow[]> {
  const supabase = createServiceRoleClient();
  const needsSlotFilter = Boolean(filter.from || filter.to);
  // Same conditional-inner-join trick as listOrdersForKanban(): only force
  // the inner join when a date filter actually needs it pushed down to
  // Postgres, so orders with no slot at all still show up otherwise.
  const slotEmbed = needsSlotFilter
    ? "delivery_slots!inner ( date, start_time, end_time )"
    : "delivery_slots ( date, start_time, end_time )";

  let query = supabase
    .from("orders")
    .select(
      `id, order_number, contact_name, contact_phone, total, status, order_source, created_at, ${slotEmbed}`,
    )
    .order("created_at", { ascending: false })
    .limit(LIST_LIMIT);

  if (filter.statuses && filter.statuses.length > 0) {
    query = query.in("status", filter.statuses);
  }
  if (filter.from) query = query.gte("delivery_slots.date", filter.from);
  if (filter.to) query = query.lte("delivery_slots.date", filter.to);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (query as any);
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data as any[]).map((row) => ({
    id: row.id,
    orderNumber: row.order_number,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    total: Number(row.total),
    status: row.status,
    orderSource: row.order_source,
    slotDate: row.delivery_slots?.date ?? null,
    slotStartTime: row.delivery_slots?.start_time ?? null,
    slotEndTime: row.delivery_slots?.end_time ?? null,
    createdAt: row.created_at,
  }));
}

/** Reuses updateOrderStatus() per order — same side effects as changing
 * one order's status from the Kanban board (payment auto-settle on
 * collected/delivered, slot capacity release on cancel, customer
 * notification, status history row, reference-image cleanup on reaching
 * a terminal status) — run sequentially rather than in parallel since
 * each call does its own read-then-write and there's no need to race
 * them for an admin-triggered, infrequent bulk action. */
export async function bulkUpdateOrderStatus(ids: string[], status: OrderStatus): Promise<void> {
  for (const id of ids) {
    await updateOrderStatus(id, status);
  }
}

/** Permanently deletes orders (and, via "on delete cascade", their
 * order_items/order_status_history/notifications rows). Storage isn't
 * covered by that cascade, so any reference photos are cleaned up first,
 * the same way updateOrderStatus() does when an order reaches a terminal
 * status. */
export async function deleteOrders(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const supabase = createServiceRoleClient();

  const { data: rows, error: fetchError } = await supabase.from("orders").select("cake_snapshot").in("id", ids);
  if (fetchError) throw fetchError;

  const urls = (rows ?? []).flatMap((row) => getReferenceImages((row.cake_snapshot as CakeSnapshot)?.spec ?? {}));
  if (urls.length > 0) await deleteReferenceImageUrls(urls);

  const { error } = await supabase.from("orders").delete().in("id", ids);
  if (error) throw error;
}
