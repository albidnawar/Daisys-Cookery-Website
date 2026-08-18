import { getHeroBannerForEdit } from "@/lib/admin/heroBannerAdmin";
import { HeroBannerForm } from "@/components/admin/HeroBannerForm";

export default async function AdminHeroBannerPage() {
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
