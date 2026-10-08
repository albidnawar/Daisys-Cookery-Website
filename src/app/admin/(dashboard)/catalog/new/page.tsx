import { CakeForm } from "@/components/admin/CakeForm";
import { listDietaryTagsAdmin, listOccasionsAdmin } from "@/lib/admin/taxonomyAdmin";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listFlavors } from "@/lib/catalog/queries";
import { requireModulePage } from "@/lib/admin/auth";

export default async function NewCakePage() {
  await requireModulePage("content_media");
  const [flavors, dietaryOptions, occasionOptions] = await Promise.all([
    listFlavors(createServiceRoleClient()),
    listDietaryTagsAdmin(),
    listOccasionsAdmin(),
  ]);

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Add a cake
      </h1>
      <CakeForm
        flavors={flavors}
        dietaryOptions={dietaryOptions}
        occasionOptions={occasionOptions}
        initial={null}
        cakeId={null}
      />
    </div>
  );
}
