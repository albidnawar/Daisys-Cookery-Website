import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { FloatingChatWidget } from "@/components/layout/FloatingChatWidget";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daisy's Cookery",
  description: "Cakes by the pound, baked to order in Chattogram.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body
        className="flex min-h-full flex-col font-body"
        suppressHydrationWarning
      >
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <FloatingChatWidget />
      </body>
    </html>
  );
}
