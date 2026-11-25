import { createServiceRoleClient } from "@/lib/supabase/server";
import { listCustomerEventTags } from "@/lib/admin/customerEventTags";
import { categorizeOrderEvent } from "@/lib/admin/orderEventCategory";
import type { CakeSnapshot } from "@/lib/types/domain";

export type CustomerOrderEntry = {
  date: string;
  total: number;
  eventCategory: string | null;
};

export type CustomerSummary = {
  contactPhone: string;
  contactName: string;
  orderCount: number;
  lifetimeSpend: number;
  lastOrderDate: string;
  customerId: string | null;
  savedAddressCount: number;
  // Every order this customer placed, most recent first — the full
  // ordering history behind orderCount/lastOrderDate, each tagged with
  // what occasion it looks like it was for (see orderEventCategory.ts).
  orders: CustomerOrderEntry[];
  // A hand-picked occasion tag for orders categorizeOrderEvent() couldn't
  // confidently tag itself (see customerEventTags.ts) — shown alongside
  // whatever auto-detected categories the customer's orders already have.
  manualTag: string | null;
};

/** Groups by contact_phone rather than customer_id — most of this
 * business's order history predates the M7 account system (it started as
 * FB-inbox-only), and even now most customers check out as guests, so
 * phone number is the only identity that actually captures repeat
 * customers. customerId is carried along (from whichever order has it) so
 * a linked account's saved addresses can still be shown. */
export async function listCustomerSummaries(): Promise<CustomerSummary[]> {
  const supabase = createServiceRoleClient();
  const [{ data, error }, manualTags] = await Promise.all([
    supabase
      .from("orders")
      .select("contact_name, contact_phone, total, created_at, customer_id, cake_snapshot")
      .neq("status", "cancelled")
      .order("created_at", { ascending: false }),
    listCustomerEventTags(),
  ]);
  if (error) throw error;

  const byPhone = new Map<string, CustomerSummary>();
  for (const row of data ?? []) {
    const snap = row.cake_snapshot as CakeSnapshot;
    const spec = snap?.spec ?? {};
    const eventText = [snap?.name, spec.message, spec.instructions].filter(Boolean).join(" ");
    const orderEntry: CustomerOrderEntry = {
      date: row.created_at,
      total: Number(row.total),
      eventCategory: categorizeOrderEvent(eventText),
    };

    const existing = byPhone.get(row.contact_phone);
    if (existing) {
      existing.orderCount += 1;
      existing.lifetimeSpend += Number(row.total);
      existing.customerId ??= row.customer_id;
      existing.orders.push(orderEntry);
    } else {
      byPhone.set(row.contact_phone, {
        contactPhone: row.contact_phone,
        contactName: row.contact_name,
        orderCount: 1,
        lifetimeSpend: Number(row.total),
        lastOrderDate: row.created_at,
        customerId: row.customer_id,
        savedAddressCount: 0,
        orders: [orderEntry],
        manualTag: manualTags.get(row.contact_phone) ?? null,
      });
    }
  }

  const customerIds = [...byPhone.values()].map((c) => c.customerId).filter((id): id is string => Boolean(id));
  if (customerIds.length > 0) {
    const { data: addresses, error: addrError } = await supabase
      .from("customer_addresses")
      .select("customer_id")
      .in("customer_id", customerIds);
    if (addrError) throw addrError;

    const addressCounts = new Map<string, number>();
    for (const a of addresses ?? []) {
      addressCounts.set(a.customer_id, (addressCounts.get(a.customer_id) ?? 0) + 1);
    }
    for (const customer of byPhone.values()) {
      if (customer.customerId) customer.savedAddressCount = addressCounts.get(customer.customerId) ?? 0;
    }
  }

  return [...byPhone.values()].sort((a, b) => b.lifetimeSpend - a.lifetimeSpend);
}
