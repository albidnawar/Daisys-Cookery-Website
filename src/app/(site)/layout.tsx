import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloatingChatWidget } from "@/components/layout/FloatingChatWidget";
import { BannerBar } from "@/components/layout/BannerBar";
import { getCurrentCustomer } from "@/lib/customer/auth";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCurrentCustomer();

  return (
    <>
      <BannerBar />
      <SiteHeader customerEmail={customer?.email ?? null} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingChatWidget />
    </>
  );
}
