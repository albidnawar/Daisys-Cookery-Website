import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileUpdateInput = {
  displayName: string | null;
  phone: string | null;
  allergenDefaults: string[];
};

export async function updateProfile(customerId: string, input: ProfileUpdateInput): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("customer_profiles").upsert({
    id: customerId,
    display_name: input.displayName,
    phone: input.phone,
    allergen_defaults: input.allergenDefaults,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
