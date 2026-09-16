import { CustomQuoteForm } from "@/components/admin/CustomQuoteForm";
import { getStoreSettings } from "@/lib/settings/store";
import { requireModulePage } from "@/lib/admin/auth";

export default async function NewCustomQuotePage() {
  await requireModulePage("custom_requests");
  const settings = await getStoreSettings();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold text-brand-chocolate">
        Log a custom request
      </h1>
      <CustomQuoteForm initial={null} quoteId={null} contactPhone={null} depositRate={settings.depositRate} />
    </div>
  );
}
