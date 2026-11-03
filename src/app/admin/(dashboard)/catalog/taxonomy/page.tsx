import Link from "next/link";
import { requireModulePage } from "@/lib/admin/auth";
import { listDietaryTagsAdmin, listOccasionsAdmin } from "@/lib/admin/taxonomyAdmin";
import { TaxonomyManager } from "@/components/admin/TaxonomyManager";

export default async function AdminTaxonomyPage() {
  await requireModulePage("content_media");
  const [dietaryTags, occasions] = await Promise.all([
    listDietaryTagsAdmin(),
    listOccasionsAdmin(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
          Flavors &amp; tags
        </h1>
        <p className="mt-1 font-body text-sm text-brand-chocolate/60">
          Manage the dietary tags and occasions cakes can be tagged with in the product catalog.
          Flavors moved to{" "}
          <Link href="/admin/catalog/options" className="font-bold text-brand-orange hover:text-brand-chocolate">
            Order Options
          </Link>{" "}
          — one list, used both for a cake&apos;s catalog flavor tag and for what customers can
          pick (and pay extra for) when customizing or ordering a cake.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
          Dietary tags
        </h2>
        <TaxonomyManager
          apiBase="/api/admin/dietary-tags"
          listKey="tags"
          bodyKey="label"
          placeholder="e.g. Nut-free"
          initialItems={dietaryTags.map((t) => ({ id: t.code, label: t.label }))}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">Occasions</h2>
        <TaxonomyManager
          apiBase="/api/admin/occasions"
          listKey="occasions"
          bodyKey="label"
          placeholder="e.g. Retirement"
          initialItems={occasions.map((o) => ({ id: o.code, label: o.label }))}
        />
      </section>
    </div>
  );
}
