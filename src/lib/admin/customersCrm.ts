import { createServiceRoleClient } from "@/lib/supabase/server";

export type CustomerSummary = {
  contactPhone: string;
  contactName: string;
  orderCount: number;
  lifetimeSpend: number;
  lastOrderDate: string;
  customerId: string | null;
  savedAddressCount: number;
};

/** Groups by contact_phone rather than customer_id — most of this
 * business's order history predates the M7 account system (it started as
 * FB-inbox-only), and even now most customers check out as guests, so
 * phone number is the only identity that actually captures repeat
 * customers. customerId is carried along (from whichever order has it) so
 * a linked account's saved addresses can still be shown. */
export async function listCustomerSummaries(): Promise<CustomerSummary[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("orders")
    .select("contact_name, contact_phone, total, created_at, customer_id")
    .neq("status", "cancelled")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const byPhone = new Map<string, CustomerSummary>();
  for (const row of data ?? []) {
    const existing = byPhone.get(row.contact_phone);
    if (existing) {
      existing.orderCount += 1;
      existing.lifetimeSpend += Number(row.total);
      existing.customerId ??= row.customer_id;
    } else {
      byPhone.set(row.contact_phone, {
        contactPhone: row.contact_phone,
        contactName: row.contact_name,
        orderCount: 1,
        lifetimeSpend: Number(row.total),
        lastOrderDate: row.created_at,
        customerId: row.customer_id,
        savedAddressCount: 0,
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
