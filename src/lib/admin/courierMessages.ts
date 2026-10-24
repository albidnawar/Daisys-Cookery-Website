import { createServiceRoleClient } from "@/lib/supabase/server";
import { pendingCashDue } from "@/lib/admin/paymentsLedger";
import type { PaymentLedgerRow } from "@/lib/admin/paymentsLedgerTypes";
import { formatBengaliDate, formatBengaliTimeOfDay, toBengaliDigits } from "@/lib/bengali";
import type { CakeSnapshot } from "@/lib/types/domain";
import type { CourierTemplateSettings } from "@/lib/admin/courierSettings";

/** rider_pickup_at is a timestamptz — this runs server-side (unlike
 * OrdersKanban's client-side equivalent, which can rely on the admin's own
 * browser being in Bangladesh), so it must convert to Asia/Dhaka wall-clock
 * time explicitly rather than via Date#getHours(), which would otherwise
 * read whatever timezone the server process happens to run in. */
function dhakaTimeOfDay(isoString: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Dhaka",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(isoString));
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0") % 24;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type CourierMessageOrder = {
  id: string;
  orderNumber: string;
  cakeDescription: string;
  customerPhone: string;
  customerAddress: string | null;
  cashAmount: number;
  /** Local "HH:MM" — null when the admin hasn't set a rider pickup time
   * yet (see rider_pickup_at on orders). */
  riderPickupTime: string | null;
  /** Raw "HH:MM:SS" from the booked delivery slot. */
  deliverySlotStartTime: string | null;
};

/** Every non-cancelled delivery order scheduled for a date, in dispatch
 * order (earliest delivery slot first) — the rows the courier-message
 * generator turns into one ready-to-paste message per order. Pickup orders
 * are excluded: they never go to a courier. */
export async function listCourierMessageOrders(date: string): Promise<CourierMessageOrder[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, cake_snapshot, contact_phone, delivery_address, payment_status, total, deposit_amount, balance_due, rider_pickup_at, delivery_slots ( date, start_time )",
    )
    .eq("fulfilment_type", "delivery")
    .neq("status", "cancelled");
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).filter((row) => row.delivery_slots?.date === date);
  rows.sort((a, b) => (a.delivery_slots?.start_time ?? "").localeCompare(b.delivery_slots?.start_time ?? ""));

  return rows.map((row) => {
    const snapshot = row.cake_snapshot as CakeSnapshot;
    const ledgerRow: PaymentLedgerRow = {
      id: row.id,
      orderNumber: row.order_number,
      contactName: "",
      contactPhone: row.contact_phone,
      cakeName: snapshot.name,
      paymentMethod: "cash_on_collection", // irrelevant to pendingCashDue's formula
      paymentStatus: row.payment_status,
      manualTrxId: null,
      total: Number(row.total),
      depositAmount: Number(row.deposit_amount),
      balanceDue: Number(row.balance_due),
      slotDate: date,
      createdAt: "",
    };

    const sizeCode = snapshot.spec.sizeCode;
    const riderPickupAt: string | null = row.rider_pickup_at;
    const riderPickupTime = riderPickupAt ? dhakaTimeOfDay(riderPickupAt) : null;

    return {
      id: row.id,
      orderNumber: row.order_number,
      cakeDescription: sizeCode ? `${sizeCode}lb ${snapshot.name}` : snapshot.name,
      customerPhone: row.contact_phone,
      customerAddress: (row.delivery_address as { text?: string } | null)?.text ?? null,
      cashAmount: pendingCashDue(ledgerRow),
      riderPickupTime,
      deliverySlotStartTime: row.delivery_slots?.start_time ?? null,
    };
  });
}

/** Builds one ready-to-paste courier message, matching the shop's existing
 * hand-typed format exactly (static boilerplate from settings, per-order
 * details filled in). sequenceNumber is this order's 1-based position in
 * that day's delivery batch — "অর্ডার ফরম" resets to ০১ every day rather
 * than counting up forever. */
export function buildCourierMessage(
  template: CourierTemplateSettings,
  order: CourierMessageOrder,
  dateKey: string,
  sequenceNumber: number,
): string {
  const orderNumBn = toBengaliDigits(String(sequenceNumber).padStart(2, "0"));
  const dateBn = formatBengaliDate(dateKey);
  const pickupTimeBn = order.riderPickupTime ? formatBengaliTimeOfDay(order.riderPickupTime) : "";
  const deliveryTimeBn = order.deliverySlotStartTime ? formatBengaliTimeOfDay(order.deliverySlotStartTime) : "";
  const cashBn = toBengaliDigits(order.cashAmount);

  return `🚴 ${template.courierName}

🔢অর্ডার ফরম:${orderNumBn}

📅তারিখ: ${dateBn}

*পিকআপ পয়েন্ট:${template.pickupPoint}

⌚ পিকআপ টাইম: ${pickupTimeBn}


আপনার ফেসবুক আইডি নাম-${template.senderFacebookName}

📞 আপনার নাম্বার-${template.senderNumber}

🌍 আপনার ঠিকানা-${template.senderAddress}

*ডেলিভারি লোকেশন:

⌚ ডেলিভারি টাইম: ${deliveryTimeBn}


কেক সাইজ: ${order.cakeDescription}


📞 কাষ্টমার ফোন: ${order.customerPhone}


🌍 কাষ্টমার ঠিকানা :  ${order.customerAddress ?? ""}


💵ক্যাশ কালেকশন: ${cashBn}+ডেলিভারি চার্জ

🏦 আপনার বিকাশ নাম্বার: ${template.bkashNumber}

☑️ আপনার পেইজের নাম-${template.pageName}

📞 আপনার ইমার্জেন্সি নাম্বার অথবা আপনার অবর্তমানে পরিবারের যে কোনো কারো নাম্বার-${template.emergencyNumber}

🚫 নোট *${template.noteText}* 💥

💥 ধন্যবাদ 💥`;
}
