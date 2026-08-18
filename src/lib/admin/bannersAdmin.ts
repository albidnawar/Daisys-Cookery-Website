import { createServiceRoleClient } from "@/lib/supabase/server";

export type AdminBanner = {
  id: string;
  message: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

export type BannerInput = {
  message: string;
  linkUrl: string | null;
  isActive: boolean;
  sortOrder: number;
};

export async function listAllBannersAdmin(): Promise<AdminBanner[]> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("banners")
    .select("id, message, link_url, is_active, sort_order")
    .order("sort_order");
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    message: row.message,
    linkUrl: row.link_url,
    isActive: row.is_active,
    sortOrder: row.sort_order,
  }));
}

function toRow(input: BannerInput) {
  return {
    message: input.message,
    link_url: input.linkUrl,
    is_active: input.isActive,
    sort_order: input.sortOrder,
  };
}

export async function createBanner(input: BannerInput): Promise<string> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("banners")
    .insert(toRow(input))
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function updateBanner(id: string, input: BannerInput): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("banners").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function deleteBanner(id: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("banners").delete().eq("id", id);
  if (error) throw error;
}
