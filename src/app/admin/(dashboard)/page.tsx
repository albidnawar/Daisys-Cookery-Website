import Link from "next/link";
import { Card } from "@/components/ui/Card";

const QUICK_LINKS = [
  { href: "/admin/catalog", label: "Product catalog", desc: "Edit cakes, prices, photos, and where they appear on the site." },
  { href: "/admin/reviews", label: "Reviews", desc: "Add customer reviews and manage the homepage marquee." },
  { href: "/admin/banners", label: "Banners", desc: "Publish site-wide announcement bars." },
];

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-semibold text-brand-chocolate">
        Welcome back
      </h1>
      <p className="mb-8 font-body text-sm text-brand-chocolate/60">
        Sales analytics and channel breakdown land in a later phase — for now,
        here&apos;s what&apos;s ready to manage.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full p-5 hover:border-brand-orange/40">
              <p className="mb-1 font-display text-lg font-semibold text-brand-chocolate">
                {link.label}
              </p>
              <p className="font-body text-sm text-brand-chocolate/60">{link.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
