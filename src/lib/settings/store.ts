import { unstable_cache } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";

export type StoreSettings = {
  depositRate: number;
  depositMode: "percentage" | "fixed";
  depositFixedAmount: number | null;
  shopAddress: string;
  shopHours: string;
  shopPhone: string;
};

// Dev fallback mirrors store_settings' own column defaults, so pricing and
// shop-contact copy work before a Supabase project exists.
const FALLBACK: StoreSettings = {
  depositRate: 0.3,
  depositMode: "percentage",
  depositFixedAmount: null,
  shopAddress: "Flat D3, House - 176, Sanmar Santino, Devpahar, College Road, Chattogram",
  shopHours: "Open 9am to 9pm, seven days",
  shopPhone: "01814438989",
};

// Called independently by the home, browse, and cake-detail pages — cached
// so a traffic surge collapses that into one Supabase round-trip every 5
// minutes instead of three per page load. Safe to cache: store_settings is
// global (not per-visitor) and an admin edits it a few times a year at
// most. Admin writes must call revalidateTag("store-settings") (see
// src/app/api/admin/settings/route.ts) so an edit isn't stuck behind the
// TTL.
async function fetchStoreSettings(): Promise<StoreSettings> {
  if (!isSupabaseConfigured()) return FALLBACK;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.from("store_settings").select("*").eq("id", true).maybeSingle();
  if (error || !data) return FALLBACK;

  return {
    depositRate: Number(data.deposit_rate),
    depositMode: data.deposit_mode === "fixed" ? "fixed" : "percentage",
    depositFixedAmount: data.deposit_fixed_amount === null ? null : Number(data.deposit_fixed_amount),
    shopAddress: data.shop_address,
    shopHours: data.shop_hours,
    shopPhone: data.shop_phone,
  };
}

export const getStoreSettings = unstable_cache(fetchStoreSettings, ["store-settings"], {
  revalidate: 300,
  tags: ["store-settings"],
});
