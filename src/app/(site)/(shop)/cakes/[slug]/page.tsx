import { notFound } from "next/navigation";
import Link from "next/link";
import { Gallery } from "@/components/cake-detail/Gallery";
import { DietaryTagList } from "@/components/cake-detail/DietaryTagList";
import { CakeDetailPurchasePanel } from "@/components/cake-detail/CakeDetailPurchasePanel";
import { SaveCakeButton } from "@/components/cake-detail/SaveCakeButton";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { getCachedCakeBySlug } from "@/lib/catalog/queries";
import { getFixtureCakeDetail } from "@/lib/catalog/fixtures";
import { getStoreSettings } from "@/lib/settings/store";

export default async function CakeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cake = isSupabaseConfigured()
    ? await getCachedCakeBySlug(slug)
    : getFixtureCakeDetail(slug);

  if (!cake) notFound();

  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <p className="mb-6 font-body text-xs text-brand-chocolate/60">
        <Link href="/browse" className="hover:text-brand-orange">
          Cakes
        </Link>
        {cake.flavor && (
          <>
            {" "}&middot;{" "}
            <Link
              href={`/browse?flavor=${cake.flavor.slug}`}
              className="hover:text-brand-orange"
            >
              {cake.flavor.name}
            </Link>
          </>
        )}{" "}
        &middot; {cake.name}
      </p>

      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Gallery
          images={[
            ...(cake.heroImageUrl ? [cake.heroImageUrl] : []),
            ...cake.galleryImageUrls,
          ]}
        />

        <div className="flex flex-col gap-4">
          {cake.flavor && (
            <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
              {cake.flavor.name}
            </span>
          )}
          <h1 className="font-display text-4xl font-semibold text-brand-chocolate sm:text-5xl">
            {cake.name}
          </h1>
          <p className="font-body text-base leading-relaxed text-brand-chocolate/80">
            {cake.description}
          </p>
          <DietaryTagList tags={cake.dietaryTags} />
          <SaveCakeButton cakeId={cake.id} />
          <hr className="border-brand-chocolate/10" />
          <CakeDetailPurchasePanel
            slug={cake.slug}
            name={cake.name}
            basePrice={cake.basePrice}
            depositRate={settings.depositRate}
            shopPhone={settings.shopPhone}
          />
        </div>
      </div>
    </div>
  );
}
