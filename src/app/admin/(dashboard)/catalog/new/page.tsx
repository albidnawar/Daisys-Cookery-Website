import { CakeForm } from "@/components/admin/CakeForm";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { listFlavors } from "@/lib/catalog/queries";

export default async function NewCakePage() {
  const flavors = await listFlavors(createServiceRoleClient());

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Add a cake
      </h1>
      <CakeForm flavors={flavors} initial={null} cakeId={null} />
    </div>
  );
}
