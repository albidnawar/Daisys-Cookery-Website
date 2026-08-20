import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloatingChatWidget } from "@/components/layout/FloatingChatWidget";
import { BannerBar } from "@/components/layout/BannerBar";
import { getCurrentCustomer } from "@/lib/customer/auth";
import { getStoreSettings } from "@/lib/settings/store";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [customer, settings] = await Promise.all([getCurrentCustomer(), getStoreSettings()]);

  return (
    <>
      <BannerBar />
      <SiteHeader customerEmail={customer?.email ?? null} />
      <main className="flex-1">{children}</main>
      <SiteFooter shopAddress={settings.shopAddress} shopPhone={settings.shopPhone} />
      <FloatingChatWidget />
    </>
  );
}
