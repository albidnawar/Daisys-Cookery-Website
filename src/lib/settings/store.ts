import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export type StoreSettings = {
  depositRate: number;
  shopAddress: string;
  shopHours: string;
  shopPhone: string;
};

// Dev fallback mirrors store_settings' own column defaults, so pricing and
// shop-contact copy work before a Supabase project exists.
const FALLBACK: StoreSettings = {
  depositRate: 0.3,
  shopAddress: "Flat D3, House - 176, Sanmar Santino, Devpahar, College Road, Chattogram",
  shopHours: "Open 9am to 9pm, seven days",
  shopPhone: "01814438989",
};

export async function getStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured()) return FALLBACK;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", true).maybeSingle();
  if (error || !data) return FALLBACK;

  return {
    depositRate: Number(data.deposit_rate),
    shopAddress: data.shop_address,
    shopHours: data.shop_hours,
    shopPhone: data.shop_phone,
  };
}
