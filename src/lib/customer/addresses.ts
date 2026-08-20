import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CustomerAddress } from "@/lib/types/domain";

export async function listAddresses(customerId: string): Promise<CustomerAddress[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("id, label, address, is_default")
    .eq("customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    label: row.label,
    text: (row.address as { text?: string })?.text ?? "",
    isDefault: row.is_default,
  }));
}

export async function createAddress(
  customerId: string,
  input: { label: string; text: string; isDefault: boolean },
): Promise<void> {
  const supabase = await createServerSupabaseClient();
  if (input.isDefault) {
    await supabase.from("customer_addresses").update({ is_default: false }).eq("customer_id", customerId);
  }
  const { error } = await supabase.from("customer_addresses").insert({
    customer_id: customerId,
    label: input.label,
    address: { text: input.text },
    is_default: input.isDefault,
  });
  if (error) throw error;
}

export async function deleteAddress(customerId: string, addressId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("customer_id", customerId);
  if (error) throw error;
}
