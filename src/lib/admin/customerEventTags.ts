import { createServiceRoleClient } from "@/lib/supabase/server";

/** Manual per-customer occasion tags the owner assigns by hand (see
 * 0041_customer_event_tags.sql) for orders categorizeOrderEvent() couldn't
 * confidently tag itself — keyed by contact_phone, the same identity
 * listCustomerSummaries() groups orders by. */
export async function listCustomerEventTags(): Promise<Map<string, string>> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("customer_event_tags").select("contact_phone, tag");
  if (error) throw error;
  return new Map((data ?? []).map((row) => [row.contact_phone, row.tag]));
}

/** An empty tag clears any existing manual tag for this customer rather
 * than storing a meaningless blank row. */
export async function setCustomerEventTag(contactPhone: string, tag: string): Promise<void> {
  const supabase = createServiceRoleClient();
  if (!tag) {
    const { error } = await supabase.from("customer_event_tags").delete().eq("contact_phone", contactPhone);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("customer_event_tags")
    .upsert({ contact_phone: contactPhone, tag, updated_at: new Date().toISOString() });
  if (error) throw error;
}
