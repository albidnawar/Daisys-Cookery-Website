import { notFound } from "next/navigation";
import { WizardShell } from "@/components/customiser/WizardShell";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { getCachedCakeBySlug } from "@/lib/catalog/queries";
import { getFixtureCakeDetail } from "@/lib/catalog/fixtures";
import { getStoreSettings } from "@/lib/settings/store";

// /customise/new is the from-scratch "Build your cake" entry point (no
// starting cake picked yet) — it uses this cake purely for base pricing
// and a default sponge; every option is still fully editable in the
// wizard, including sponge flavor itself.
const DEFAULT_FROM_SCRATCH_SLUG = "the-vanilla-bean";

export default async function CustomisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const effectiveSlug = slug === "new" ? DEFAULT_FROM_SCRATCH_SLUG : slug;

  const cake = isSupabaseConfigured()
    ? await getCachedCakeBySlug(effectiveSlug)
    : getFixtureCakeDetail(effectiveSlug);

  if (!cake || !cake.isCustomisable) notFound();

  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-6xl">
      <div className="px-4 pt-8 sm:px-8">
        <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
          {slug === "new" ? "Build your cake" : `Customise ${cake.name}`}
        </p>
      </div>
      <WizardShell
        cake={cake}
        depositRate={settings.depositRate}
        isFromScratch={slug === "new"}
      />
    </div>
  );
}
