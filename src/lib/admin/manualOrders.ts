import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { createAdminHoldDraft, markDraftOrderConverted, resolveCake } from "@/lib/draftOrders/store";
import { convertHold, getSlotLabel, holdSlot, listZones, DailyCapReachedError, DateBlockedError } from "@/lib/slots/store";
import { calculatePrice, fixedPrice, withDeliveryFee } from "@/lib/pricing/calculatePrice";
import { toDepositConfig } from "@/lib/pricing/deposit";
import { getStoreSettings } from "@/lib/settings/store";
import { generateOrderNumber } from "@/lib/orders/store";
import { formatSlotLabelForDisplay } from "@/lib/dates";
import { notifyOrderStatusChange } from "@/lib/notifications/notify";
import { normalizePhone } from "@/lib/phone";
import type {
  CakeSnapshot,
  DraftOrderSpec,
  Order,
  PaymentMethod,
  PaymentStatus,
  PriceBreakdown,
} from "@/lib/types/domain";

export type CustomerLookupResult = {
  contactName: string;
  deliveryAddress: Record<string, unknown> | null;
  pastOrders: {
    orderNumber: string;
    cakeName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
};

/** "Customer Lookup & Auto-Fill" — since there's no full customer-accounts
 * system yet (see M7 in the site plan), this just looks at past orders'
 * contact_phone. Good enough for the repeat-FB-customer case the admin
 * portal spec calls out. */
export async function searchCustomerByPhone(phone: string): Promise<CustomerLookupResult | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select("order_number, cake_snapshot, total, status, contact_name, delivery_address, created_at")
    .eq("contact_phone", normalizePhone(phone))
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  if (!data || data.length === 0) return null;

  const latest = data[0];
  return {
    contactName: latest.contact_name,
    deliveryAddress: latest.delivery_address,
    pastOrders: data.map((row) => ({
      orderNumber: row.order_number,
      cakeName: (row.cake_snapshot as CakeSnapshot).name,
      total: Number(row.total),
      status: row.status,
      createdAt: row.created_at,
    })),
  };
}

export type ManualOrderInput = {
  cakeSlug: string | null;
  customCakeName: string | null;
  spec: DraftOrderSpec;
  fulfilmentType: "pickup" | "delivery";
  zoneId: string;
  date: string;
  startTime: string;
  deliveryAddress: Record<string, unknown> | null;
  contactName: string;
  contactPhone: string;
  kitchenNote: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  manualTrxId: string | null;
  priceOverride: number | null;
  depositOverride: number | null;
  createdByAdminId: string;
};

export class ManualOrderError extends Error {}

export async function createManualOrder(input: ManualOrderInput): Promise<Order> {
  let cakeName = input.customCakeName;
  let cakeId: string | null = null;

  const zones = await listZones();
  const zone = zones.find((z) => z.id === input.zoneId);
  if (!zone) throw new ManualOrderError("Unknown delivery zone");
  const deliveryFee = input.fulfilmentType === "delivery" ? zone.deliveryFee : 0;
  const deposit = toDepositConfig(await getStoreSettings());

  // A priceOverride replaces the whole cake price (extras included, hence
  // fixedPrice's extrasTotal: 0) — same shape a Custom Quote gets from
  // calculatePrice.ts, so it flows through the identical withDeliveryFee
  // step as every other order type instead of a second hand-rolled copy.
  let price: PriceBreakdown;
  if (input.cakeSlug) {
    const cake = await resolveCake(input.cakeSlug);
    if (!cake) throw new ManualOrderError("Unknown cake");
    cakeName = cake.name;
    cakeId = cake.id;
    if (input.priceOverride != null) {
      price = fixedPrice(input.priceOverride, deposit);
    } else {
      const cakePrice = calculatePrice(cake, input.spec, deposit);
      if (!cakePrice) throw new ManualOrderError("Size must be set, or provide a manual price for a >5lb order");
      price = cakePrice;
    }
  } else {
    if (!cakeName) throw new ManualOrderError("Give the custom cake a name");
    if (input.priceOverride == null) {
      throw new ManualOrderError("A fully custom cake needs a manually entered price");
    }
    price = fixedPrice(input.priceOverride, deposit);
  }
  const { subtotal, extrasTotal, total, depositAmount: computedDeposit } = withDeliveryFee(
    price,
    deliveryFee,
    deposit,
  );

  const depositAmount = input.depositOverride ?? computedDeposit;
  const balanceDue = total - depositAmount;

  // Manual orders go through the same date-blocked / day-level cap checks
  // as web orders — book_exact_time() (see
  // 0032_local_delivery_and_exact_time_booking.sql) creates a fresh,
  // single-use slot row for this exact date+time rather than picking from
  // a shared list. hold_slot's FK requires a real draft_orders row, hence
  // this rather than a bare random id.
  const holdDraftId = await createAdminHoldDraft(cakeId);
  let slotId: string;
  try {
    const hold = await holdSlot({
      date: input.date,
      startTime: input.startTime,
      fulfilmentType: input.fulfilmentType,
      zoneId: input.zoneId,
      draftId: holdDraftId,
    });
    slotId = hold.slotId;
  } catch (error) {
    if (error instanceof DateBlockedError) {
      throw new ManualOrderError("That date isn't available for orders.");
    }
    if (error instanceof DailyCapReachedError) {
      throw new ManualOrderError("That date has reached its production limit.");
    }
    throw error;
  }

  const slotLabel = await getSlotLabel(slotId);
  const cakeSnapshot: CakeSnapshot = { name: cakeName!, slug: input.cakeSlug, spec: input.spec };

  const order: Order = {
    id: randomUUID(),
    orderNumber: generateOrderNumber(),
    customerId: null,
    cakeSnapshot,
    fulfilmentType: input.fulfilmentType,
    zoneId: input.zoneId,
    zoneName: zone.name,
    deliveryAddress: input.deliveryAddress,
    slotId,
    slotLabel,
    subtotal,
    extrasTotal,
    deliveryFee,
    total,
    depositAmount,
    balanceDue,
    paymentMethod: input.paymentMethod,
    paymentStatus: input.paymentStatus,
    status: "received",
    contactName: input.contactName,
    contactPhone: normalizePhone(input.contactPhone),
    kitchenNote: input.kitchenNote,
    orderSource: "manual",
    manualTrxId: input.manualTrxId,
    needsRiderPickup: false,
    riderPickupAt: null,
    riderName: null,
    riderPhone: null,
    createdAt: new Date().toISOString(),
  };

  const supabase = createServiceRoleClient();
  const { error: orderError } = await supabase.from("orders").insert({
    id: order.id,
    order_number: order.orderNumber,
    draft_order_id: holdDraftId,
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
    order_source: "manual",
    manual_trx_id: order.manualTrxId,
    created_by_admin_id: input.createdByAdminId,
    created_at: order.createdAt,
  });
  if (orderError) throw orderError;

  await supabase.from("order_items").insert({
    order_id: order.id,
    cake_snapshot: cakeSnapshot,
    qty: 1,
    line_total: order.total,
  });
  await supabase.from("order_status_history").insert({
    order_id: order.id,
    status: order.status,
    changed_by: "admin",
  });

  // Convert the hold the same way a real checkout would — removes the
  // slot_holds row without double-decrementing capacity (it was already
  // counted when the hold was created).
  await convertHold(slotId, holdDraftId);
  await markDraftOrderConverted(holdDraftId);
  await notifyOrderStatusChange(order.id, order.status);

  return order;
}

/** Builds the "1-click inbox order slip" text — pasted back into the FB
 * chat, or opened as a pre-filled wa.me link, to confirm the order. */
export function buildOrderSlipText(order: Order): string {
  const lines = [
    `Daisy's Cookery: Order ${order.orderNumber}`,
    `Cake: ${order.cakeSnapshot.name}`,
    order.slotLabel ? `Collection/Delivery: ${formatSlotLabelForDisplay(order.slotLabel)}` : null,
    `Total: ৳${order.total.toLocaleString("en-BD")}`,
    `Deposit due now: ৳${order.depositAmount.toLocaleString("en-BD")}`,
    `Balance: ৳${order.balanceDue.toLocaleString("en-BD")}`,
    order.cakeSnapshot.spec.message ? `Message on cake: "${order.cakeSnapshot.spec.message}"` : null,
    "Thank you for ordering with Daisy's Cookery!",
  ];
  return lines.filter(Boolean).join("\n");
}
