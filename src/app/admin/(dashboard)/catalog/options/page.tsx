import { requireModulePage } from "@/lib/admin/auth";
import { listOptionValuesAdmin } from "@/lib/admin/optionValuesAdmin";
import { OptionValuesManager } from "@/components/admin/OptionValuesManager";

export default async function AdminOrderOptionsPage() {
  await requireModulePage("content_media");
  const [flavors, colors, extras] = await Promise.all([
    listOptionValuesAdmin("sponge"),
    listOptionValuesAdmin("cake_color"),
    listOptionValuesAdmin("extras"),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
          Order options
        </h1>
        <p className="mt-1 font-body text-sm text-brand-chocolate/60">
          Manage the flavor, cake color, and candles/topper choices customers pick when ordering
          a cake, each with an optional extra price.
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">Flavor</h2>
        <OptionValuesManager
          groupCode="sponge"
          placeholder="e.g. Pistachio"
          initialItems={flavors.map((v) => ({ id: v.id, label: v.label, priceDelta: v.priceDelta }))}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
          Cake color
        </h2>
        <OptionValuesManager
          groupCode="cake_color"
          placeholder="e.g. Rose gold"
          initialItems={colors.map((v) => ({ id: v.id, label: v.label, priceDelta: v.priceDelta }))}
        />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-semibold text-brand-chocolate">
          Candles &amp; toppers
        </h2>
        <OptionValuesManager
          groupCode="extras"
          placeholder="e.g. Sparkler"
          initialItems={extras.map((v) => ({ id: v.id, label: v.label, priceDelta: v.priceDelta }))}
        />
      </section>
    </div>
  );
}
