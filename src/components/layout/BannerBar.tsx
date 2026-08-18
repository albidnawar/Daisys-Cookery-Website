import Link from "next/link";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { listActiveBanners } from "@/lib/banners/queries";

export async function BannerBar() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createServerSupabaseClient();
  const banners = await listActiveBanners(supabase);
  const banner = banners[0];
  if (!banner) return null;

  const content = (
    <p className="mx-auto max-w-6xl px-4 py-2 text-center font-body text-sm font-bold text-white sm:px-8">
      {banner.message}
    </p>
  );

  return (
    <div className="bg-brand-chocolate">
      {banner.linkUrl ? <Link href={banner.linkUrl}>{content}</Link> : content}
    </div>
  );
}
