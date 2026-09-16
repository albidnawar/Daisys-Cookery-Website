import { getHeroBannerForEdit } from "@/lib/admin/heroBannerAdmin";
import { requireModulePage } from "@/lib/admin/auth";
import { HeroBannerForm } from "@/components/admin/HeroBannerForm";

export default async function AdminHeroBannerPage() {
  await requireModulePage("content_media");
  const heroBanner = await getHeroBannerForEdit();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Homepage hero image
      </h1>
      <HeroBannerForm initial={heroBanner} />
    </div>
  );
}
