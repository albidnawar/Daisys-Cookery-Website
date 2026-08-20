import { getCurrentAdmin } from "@/lib/admin/auth";
import { getStoreSettings } from "@/lib/settings/store";
import { listAdminAccounts } from "@/lib/admin/adminAccounts";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { AdminAccountsManager } from "@/components/admin/AdminAccountsManager";
import { ChangePasswordForm } from "@/components/admin/ChangePasswordForm";

export default async function AdminSettingsPage() {
  const admin = await getCurrentAdmin();
  if (!admin) return null;

  if (admin.role !== "owner") {
    return (
      <div className="flex flex-col gap-10">
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">Settings</h1>
        <p className="font-body text-sm text-brand-chocolate/60">
          Store settings and admin accounts are managed by an owner. You can still update your
          own password below.
        </p>
        <ChangePasswordForm />
      </div>
    );
  }

  const [settings, accounts] = await Promise.all([getStoreSettings(), listAdminAccounts()]);

  return (
    <div className="flex flex-col gap-10">
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate">Settings</h1>

      <div>
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">Store settings</h2>
        <StoreSettingsForm initial={settings} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">Admin accounts</h2>
        <AdminAccountsManager accounts={accounts} currentAdminId={admin.id} />
      </div>

      <div>
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">Your account</h2>
        <ChangePasswordForm />
      </div>
    </div>
  );
}
