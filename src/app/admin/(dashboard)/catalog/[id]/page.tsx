import { notFound } from "next/navigation";
import { CakeForm } from "@/components/admin/CakeForm";
import { getCakeForEdit } from "@/lib/admin/catalogAdmin";
import { listDietaryTagsAdmin, listOccasionsAdmin } from "@/lib/admin/taxonomyAdmin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listFlavors } from "@/lib/catalog/queries";
import { requireModulePage } from "@/lib/admin/auth";

export default async function EditCakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireModulePage("content_media");
  const { id } = await params;
  const [cake, flavors, dietaryOptions, occasionOptions] = await Promise.all([
    getCakeForEdit(id),
    listFlavors(createServiceRoleClient()),
    listDietaryTagsAdmin(),
    listOccasionsAdmin(),
  ]);
  if (!cake) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Edit {cake.name}
      </h1>
      <CakeForm
        flavors={flavors}
        dietaryOptions={dietaryOptions}
        occasionOptions={occasionOptions}
        initial={cake}
        cakeId={id}
      />
    </div>
  );
}
