import { Card } from "@/components/ui/Card";
import { getStoreSettings } from "@/lib/settings/store";

export default async function AboutPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-8">
      <p className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Our shop
      </p>
      <h1 className="mb-6 font-display text-5xl font-semibold text-brand-chocolate">
        Baked in Chattogram since 2022.
      </h1>
      <p className="mb-10 max-w-2xl font-body text-base leading-relaxed text-brand-chocolate/80">
        Every cake is baked to order the morning it&apos;s collected or delivered
        — nothing sits pre-made in a case. Drop by to pick up an order, ask
        about a custom design in person, or just say hello.
      </p>

      <div className="grid gap-6 sm:grid-cols-2">
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="font-display text-xl font-medium text-brand-chocolate">
            Visit us
          </h2>
          <p className="font-body text-sm leading-relaxed text-brand-chocolate/75">
            {settings.shopAddress}
          </p>
        </Card>
        <Card className="flex flex-col gap-2 p-6">
          <h2 className="font-display text-xl font-medium text-brand-chocolate">
            Talk to us
          </h2>
          <p className="font-body text-sm leading-relaxed text-brand-chocolate/75">
            Call {settings.shopPhone}, or use the chat button in the corner of any
            page for WhatsApp/Messenger.
          </p>
        </Card>
        <Card className="p-6 sm:col-span-2">
          <h2 className="mb-3 font-display text-xl font-medium text-brand-chocolate">
            Opening hours
          </h2>
          <p className="font-body text-sm text-brand-chocolate/75">{settings.shopHours}</p>
        </Card>
      </div>
    </div>
  );
}
