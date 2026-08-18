import type { SupabaseClient } from "@supabase/supabase-js";

type Client = SupabaseClient;

export type Banner = {
  id: string;
  message: string;
  linkUrl: string | null;
};

export async function listActiveBanners(supabase: Client): Promise<Banner[]> {
  const { data, error } = await supabase
    .from("banners")
    .select("id, message, link_url")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    message: row.message,
    linkUrl: row.link_url,
  }));
}
