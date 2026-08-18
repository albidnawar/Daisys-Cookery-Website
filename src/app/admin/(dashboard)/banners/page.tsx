import { listAllBannersAdmin } from "@/lib/admin/bannersAdmin";
import { BannersManager } from "@/components/admin/BannersManager";

export default async function AdminBannersPage() {
  const banners = await listAllBannersAdmin();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Banners
      </h1>
      <BannersManager initialBanners={banners} />
    </div>
  );
}
