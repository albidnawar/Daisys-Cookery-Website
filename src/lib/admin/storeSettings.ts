import { createServiceRoleClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/lib/settings/store";

export async function updateStoreSettings(input: StoreSettings): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("store_settings")
    .update({
      deposit_rate: input.depositRate,
      deposit_mode: input.depositMode,
      deposit_fixed_amount: input.depositFixedAmount,
      custom_order_advance_amount: input.customOrderAdvanceAmount,
      shop_address: input.shopAddress,
      shop_hours: input.shopHours,
      shop_phone: input.shopPhone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);
  if (error) throw error;
}
