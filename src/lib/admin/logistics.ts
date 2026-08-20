import { createServiceRoleClient } from "@/lib/supabase/server";
import { pendingCashDue, type PaymentLedgerRow } from "@/lib/admin/paymentsLedger";
import type { CakeSnapshot } from "@/lib/types/domain";

export type DateCapacitySetting = {
  date: string;
  isBlocked: boolean;
  maxOrders: number | null;
  note: string | null;
};

export type DateCapacityRow = DateCapacitySetting & {
  bookedCount: number;
};

/** One row per date in [fromDate, toDate], with that date's total bookings
 * across every slot (pickup + delivery combined — the cap is about kitchen
 * output, not any one fulfilment channel) alongside any admin override. */
export async function listDateCapacityRows(fromDate: string, toDate: string): Promise<DateCapacityRow[]> {
  const supabase = createServiceRoleClient();
  const [{ data: slots, error: slotsError }, { data: settings, error: settingsError }] = await Promise.all([
    supabase.from("delivery_slots").select("date, booked_count").gte("date", fromDate).lte("date", toDate),
    supabase
      .from("date_capacity_settings")
      .select("date, is_blocked, max_orders, note")
      .gte("date", fromDate)
      .lte("date", toDate),
  ]);
  if (slotsError) throw slotsError;
  if (settingsError) throw settingsError;

  const bookedByDate = new Map<string, number>();
  for (const row of slots ?? []) {
    bookedByDate.set(row.date, (bookedByDate.get(row.date) ?? 0) + row.booked_count);
  }
  const settingsByDate = new Map((settings ?? []).map((s) => [s.date, s]));

  const rows: DateCapacityRow[] = [];
  for (const d = new Date(`${fromDate}T00:00:00`); d <= new Date(`${toDate}T00:00:00`); d.setDate(d.getDate() + 1)) {
    const dateKey = d.toISOString().slice(0, 10);
    const setting = settingsByDate.get(dateKey);
    rows.push({
      date: dateKey,
      isBlocked: setting?.is_blocked ?? false,
      maxOrders: setting?.max_orders ?? null,
      note: setting?.note ?? null,
      bookedCount: bookedByDate.get(dateKey) ?? 0,
    });
  }
  return rows;
}

export async function upsertDateCapacitySetting(input: DateCapacitySetting): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("date_capacity_settings").upsert({
    date: input.date,
    is_blocked: input.isBlocked,
    max_orders: input.maxOrders,
    note: input.note,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export type ManifestRow = {
  id: string;
  orderNumber: string;
  contactName: string;
  contactPhone: string;
  cakeName: string;
  fulfilmentType: "pickup" | "delivery";
  zoneName: string;
  addressText: string | null;
  codAmount: number;
  slotLabel: string | null;
};

/** Every non-cancelled order scheduled for a date, grouped implicitly by
 * zone (the caller groups client-side) — covers both the Zone-Based
 * Delivery Manager view and the Courier Export, since they need the same
 * underlying rows. */
export async function listManifestForDate(date: string): Promise<ManifestRow[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, cake_snapshot, contact_name, contact_phone, fulfilment_type, delivery_address, payment_status, total, deposit_amount, balance_due, delivery_zones ( name ), delivery_slots ( date, start_time, end_time )",
    )
    .neq("status", "cancelled");
  if (error) throw error;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data as any[]).filter((row) => row.delivery_slots?.date === date);

  return rows.map((row) => {
    const ledgerRow: PaymentLedgerRow = {
      id: row.id,
      orderNumber: row.order_number,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      cakeName: (row.cake_snapshot as CakeSnapshot).name,
      paymentMethod: "cash_on_collection", // irrelevant to pendingCashDue's formula
      paymentStatus: row.payment_status,
      manualTrxId: null,
      total: Number(row.total),
      depositAmount: Number(row.deposit_amount),
      balanceDue: Number(row.balance_due),
      slotDate: date,
      createdAt: "",
    };
    const slot = row.delivery_slots;
    return {
      id: row.id,
      orderNumber: row.order_number,
      contactName: row.contact_name,
      contactPhone: row.contact_phone,
      cakeName: (row.cake_snapshot as CakeSnapshot).name,
      fulfilmentType: row.fulfilment_type,
      zoneName: row.delivery_zones?.name ?? "—",
      addressText: (row.delivery_address as { text?: string } | null)?.text ?? null,
      codAmount: pendingCashDue(ledgerRow),
      slotLabel: slot ? `${slot.start_time.slice(0, 5)}-${slot.end_time.slice(0, 5)}` : null,
    };
  });
}

function csvField(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** A generic manifest CSV covering the fields any courier (Steadfast,
 * Pathao, RedX) or an internal rider needs — recipient, phone, address,
 * COD amount, item. Column headers may need light renaming to match a
 * specific courier's own bulk-upload template. */
export function buildManifestCsv(rows: ManifestRow[]): string {
  const header = ["Order", "Recipient", "Phone", "Address", "Zone", "Slot", "Item", "COD Amount (BDT)"];
  const lines = [header.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(
      [
        row.orderNumber,
        row.contactName,
        row.contactPhone,
        row.addressText ?? (row.fulfilmentType === "pickup" ? "Shop pickup" : ""),
        row.zoneName,
        row.slotLabel ?? "",
        row.cakeName,
        row.codAmount,
      ]
        .map(csvField)
        .join(","),
    );
  }
  return lines.join("\n");
}
