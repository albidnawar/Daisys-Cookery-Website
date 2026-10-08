import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { readJson, withFileLock, writeJson } from "@/lib/devStore/fileStore";
import { getDraftOrder, markDraftOrderConverted, resolveCake } from "@/lib/draftOrders/store";
import { convertHold, formatSlotLabel, getSlotLabel, listZones } from "@/lib/slots/store";
import { calculatePrice, withDeliveryFee } from "@/lib/pricing/calculatePrice";
import { getStoreSettings } from "@/lib/settings/store";
import { getPaymentProvider } from "@/lib/payments";
import { notifyOrderStatusChange } from "@/lib/notifications/notify";
import { normalizePhone } from "@/lib/phone";
import type { Order, PaymentMethod } from "@/lib/types/domain";

const STORE_NAME = "orders";

async function readAll(): Promise<Record<string, Order>> {
  return readJson<Record<string, Order>>(STORE_NAME, {});
}

async function writeOne(order: Order): Promise<void> {
  await withFileLock(STORE_NAME, async () => {
    const all = await readAll();
    all[order.id] = order;
    await writeJson(STORE_NAME, all);
  });
}

export function generateOrderNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `DC-${datePart}-${randomPart}`;
}

export type CreateOrderInput = {
  draftId: string;
  contactName: string;
  contactPhone: string;
  kitchenNote?: string;
  paymentMethod: PaymentMethod;
  manualTrxId?: string | null;
  customerId?: string | null;
};

export class OrderValidationError extends Error {}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const draft = await getDraftOrder(input.draftId);
  if (!draft) throw new OrderValidationError("Draft order not found");
  // A Module 5 custom-quote draft has no catalog cake at all — its
  // computedPrice is the admin's fixed quote (see fixedPrice()) rather
  // than something calculatePrice() can (re-)derive from a slug.
  const isCustomQuote = !draft.cakeSlug && Boolean(draft.customCakeName);
  if (!isCustomQuote && !draft.cakeSlug) {
    throw new OrderValidationError("Draft is missing a cake");
  }
  if (!draft.fulfilmentType || !draft.zoneId || !draft.slotId) {
    throw new OrderValidationError("Draft is missing fulfilment details");
  }
  if (draft.status === "converted") {
    throw new OrderValidationError("This draft has already been ordered");
  }

  const zones = await listZones();
  const zone = zones.find((z) => z.id === draft.zoneId);
  if (!zone) throw new OrderValidationError("Unknown delivery zone");
  const deliveryFee = draft.fulfilmentType === "delivery" ? zone.deliveryFee : 0;
  const { depositRate } = await getStoreSettings();

  let price;
  let cakeSnapshot;
  if (isCustomQuote) {
    if (!draft.computedPrice) throw new OrderValidationError("This quote has no price yet");
    price = withDeliveryFee(draft.computedPrice, deliveryFee, depositRate);
    cakeSnapshot = { name: draft.customCakeName!, slug: null, spec: draft.spec };
  } else {
    const cake = await resolveCake(draft.cakeSlug!);
    if (!cake) throw new OrderValidationError("Unknown cake");
    const cakePrice = calculatePrice(cake, draft.spec, depositRate);
    if (!cakePrice) throw new OrderValidationError("Cake size must be set before checkout");
    price = withDeliveryFee(cakePrice, deliveryFee, depositRate);
    cakeSnapshot = { name: cake.name, slug: cake.slug, spec: draft.spec };
  }

  const slotLabel = await getSlotLabel(draft.slotId);

  const order: Order = {
    id: randomUUID(),
    orderNumber: generateOrderNumber(),
    customerId: input.customerId ?? null,
    cakeSnapshot,
    fulfilmentType: draft.fulfilmentType,
    zoneId: draft.zoneId,
    zoneName: zone.name,
    deliveryAddress: draft.deliveryAddress,
    slotId: draft.slotId,
    slotLabel,
    subtotal: price.subtotal,
    extrasTotal: price.extrasTotal,
    deliveryFee,
    total: price.total,
    depositAmount: price.depositAmount,
    balanceDue: price.balanceDue,
    paymentMethod: input.paymentMethod,
    paymentStatus: "pending",
    status: "received",
    contactName: input.contactName,
    contactPhone: normalizePhone(input.contactPhone),
    kitchenNote: input.kitchenNote ?? null,
    orderSource: "web",
    manualTrxId: input.manualTrxId ?? null,
    needsRiderPickup: false,
    riderPickupAt: null,
    createdAt: new Date().toISOString(),
  };

  // bKash/Nagad have no merchant gateway — the customer sends money to a
  // personal number and self-reports the TrxID, which stays "pending"
  // until an admin manually matches it against their own app (see the
  // Payments ledger). Cash on collection needs no payment step at all.
  // Card is the only method still exercised through the mock provider
  // seam, standing in for a future real gateway.
  if (input.paymentMethod === "card") {
    const intent = await getPaymentProvider().createIntent({
      orderId: order.id,
      amount: order.depositAmount,
      method: input.paymentMethod,
    });
    order.paymentStatus = intent.status === "succeeded" ? "deposit_paid" : "failed";
  }

  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { error: orderError } = await supabase.from("orders").insert({
      id: order.id,
      order_number: order.orderNumber,
      customer_id: order.customerId,
      draft_order_id: draft.id,
      cake_snapshot: cakeSnapshot,
      fulfilment_type: order.fulfilmentType,
      zone_id: order.zoneId,
      delivery_address: order.deliveryAddress,
      slot_id: order.slotId,
      subtotal: order.subtotal,
      extras_total: order.extrasTotal,
      delivery_fee: order.deliveryFee,
      total: order.total,
      deposit_amount: order.depositAmount,
      balance_due: order.balanceDue,
      payment_method: order.paymentMethod,
      payment_status: order.paymentStatus,
      status: order.status,
      contact_name: order.contactName,
      contact_phone: order.contactPhone,
      kitchen_note: order.kitchenNote,
      manual_trx_id: order.manualTrxId,
      created_at: order.createdAt,
    });
    if (orderError) {
      // 23505 = unique_violation on orders_draft_order_id_key (see
      // 0019_orders_draft_order_id_unique.sql) — a concurrent/retried
      // request for the same draft already won the race and inserted its
      // order first. Return that order instead of a 500, so a double-click
      // during a slow moment (exactly what a traffic surge causes) reads
      // as "same order twice," not an error.
      if (orderError.code === "23505") {
        const existing = await getOrderByDraftId(draft.id);
        if (existing) return existing;
      }
      throw orderError;
    }

    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: order.id,
      cake_snapshot: cakeSnapshot,
      qty: 1,
      line_total: order.total,
    });
    if (itemError) throw itemError;

    const { error: historyError } = await supabase.from("order_status_history").insert({
      order_id: order.id,
      status: order.status,
      changed_by: "system",
    });
    if (historyError) throw historyError;
  } else {
    await writeOne(order);
  }

  await convertHold(draft.slotId, draft.id);
  await markDraftOrderConverted(draft.id);
  await notifyOrderStatusChange(order.id, order.status);

  return order;
}

export async function getOrder(id: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, delivery_zones ( name ), delivery_slots ( date, start_time, end_time )",
      )
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToOrder(data);
  }
  const all = await readAll();
  return all[id] ?? null;
}

/** Used by createOrder()'s duplicate-race handling — see 0019_orders_draft_order_id_unique.sql. */
export async function getOrderByDraftId(draftId: string): Promise<Order | null> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "*, delivery_zones ( name ), delivery_slots ( date, start_time, end_time )",
      )
      .eq("draft_order_id", draftId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return rowToOrder(data);
  }
  // The dev file-store's Order records don't track their originating
  // draftId, and this path is only ever reached from the DB unique-
  // constraint race handler above, which is Supabase-only — nothing to
  // look up here.
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToOrder(row: any): Order {
  const slot = row.delivery_slots;
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id ?? null,
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
    createdAt: row.created_at,
  };
}
