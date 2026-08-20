import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { CustomerProfile } from "@/lib/types/domain";

export class CustomerAuthError extends Error {
  constructor() {
    super("Not authorized");
  }
}

/** Server Components / route handlers: returns the signed-in customer (with
 * their profile row), or null if there's no session. Any Supabase Auth user
 * who isn't an admin is a customer — there's no separate allow-list table
 * the way admin_users gates admin access. */
export async function getCurrentCustomer(): Promise<CustomerProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("customer_profiles")
    .select("display_name, phone, allergen_defaults")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name ?? null,
    phone: profile?.phone ?? null,
    allergenDefaults: profile?.allergen_defaults ?? [],
  };
}

export async function requireCustomer(): Promise<CustomerProfile> {
  const customer = await getCurrentCustomer();
  if (!customer) throw new CustomerAuthError();
  return customer;
}
