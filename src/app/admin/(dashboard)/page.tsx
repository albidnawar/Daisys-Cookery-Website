import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { getSalesSummary, getTopSellerStats, type RankedStat } from "@/lib/admin/analytics";

const QUICK_LINKS = [
  { href: "/admin/catalog", label: "Product catalog", desc: "Edit cakes, prices, photos, and where they appear on the site." },
  { href: "/admin/reviews", label: "Reviews", desc: "Add customer reviews and manage the homepage marquee." },
  { href: "/admin/banners", label: "Banners", desc: "Publish site-wide announcement bars." },
  { href: "/admin/customers", label: "Customers", desc: "Repeat customers, lifetime spend, and order history." },
];

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
      <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-brand-chocolate">{value}</p>
    </div>
  );
}

function RankedList({ title, items, emptyText }: { title: string; items: RankedStat[]; emptyText: string }) {
  return (
    <div className="rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
      <p className="mb-3 font-display text-lg font-semibold text-brand-chocolate">{title}</p>
      {items.length === 0 ? (
        <p className="font-body text-sm text-brand-chocolate/60">{emptyText}</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {items.map((item, i) => (
            <li key={item.label} className="flex items-center justify-between font-body text-sm">
              <span className="text-brand-chocolate">
                {i + 1}. {item.label}
              </span>
              <span className="font-bold text-brand-orange">{item.count}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default async function AdminOverviewPage() {
  const [sales, topSellers] = await Promise.all([getSalesSummary(), getTopSellerStats(30)]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-2 font-display text-3xl font-semibold text-brand-chocolate">
          Welcome back
        </h1>
        <p className="mb-6 font-body text-sm text-brand-chocolate/60">
          Sales performance and top sellers, updated live from your order history.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Today's revenue" value={`৳${sales.dailyRevenue.toLocaleString("en-BD")}`} />
          <StatCard label="Orders today" value={String(sales.dailyOrderCount)} />
          <StatCard label="This month's revenue" value={`৳${sales.monthlyRevenue.toLocaleString("en-BD")}`} />
          <StatCard label="Orders this month" value={String(sales.monthlyOrderCount)} />
        </div>

        <div className="mt-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-5">
          <p className="mb-2 font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/50">
            Channel breakdown (this month)
          </p>
          <div className="flex flex-wrap gap-6 font-body text-sm text-brand-chocolate">
            <span>
              🌐 Web: <strong>{sales.webOrderCount}</strong> orders
            </span>
            <span>
              💬 Manual / FB inbox: <strong>{sales.manualOrderCount}</strong> orders
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
          Top sellers (last 30 days)
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <RankedList title="Top flavors" items={topSellers.topFlavors} emptyText="No flavor data yet." />
          <RankedList title="Popular weights" items={topSellers.topWeights} emptyText="No orders yet." />
          <RankedList title="Popular designs" items={topSellers.topDesigns} emptyText="No orders yet." />
        </div>
      </div>

      <div>
        <h2 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">Manage</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
    </div>
  );
}
