import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloatingChatWidget } from "@/components/layout/FloatingChatWidget";
import { BannerBar } from "@/components/layout/BannerBar";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BannerBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingChatWidget />
    </>
  );
}
