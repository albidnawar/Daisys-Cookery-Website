import { CustomQuoteForm } from "@/components/admin/CustomQuoteForm";
import { getStoreSettings } from "@/lib/settings/store";

export default async function NewCustomQuotePage() {
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
