import Link from "next/link";
import { listAllCakesAdmin } from "@/lib/admin/catalogAdmin";
import { requireModulePage } from "@/lib/admin/auth";
import { LinkButton } from "@/components/ui/Button";
import { DeleteButton } from "@/components/admin/DeleteButton";

export default async function AdminCatalogPage() {
  await requireModulePage("content_media");
  const cakes = await listAllCakesAdmin();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
          Product catalog
        </h1>
        <LinkButton href="/admin/catalog/new" variant="primary">
          + Add cake
        </LinkButton>
      </div>

      <div className="overflow-x-auto rounded-2xl border-2 border-brand-chocolate/10 bg-white">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-brand-chocolate/10 text-left text-xs uppercase tracking-widest text-brand-chocolate/50">
              <th className="p-3">Name</th>
              <th className="p-3">Flavor</th>
              <th className="p-3">Price</th>
              <th className="p-3">Availability</th>
              <th className="p-3">Home grid</th>
              <th className="p-3">Visible</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {cakes.map((cake) => (
              <tr key={cake.id} className="border-b border-brand-chocolate/5 last:border-0">
                <td className="p-3 font-bold text-brand-chocolate">{cake.name}</td>
                <td className="p-3 text-brand-chocolate/70">{cake.flavorName ?? "-"}</td>
                <td className="p-3 text-brand-chocolate/70">
                  ৳{cake.basePrice.toLocaleString("en-BD")}
                </td>
                <td className="p-3 text-brand-chocolate/70">{cake.availability}</td>
                <td className="p-3 text-brand-chocolate/70">{cake.isFeaturedHome ? "Yes" : "-"}</td>
                <td className="p-3">{cake.isActive ? "✅" : "🚫"}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-4">
                    <Link
                      href={`/admin/catalog/${cake.id}`}
                      className="font-bold text-brand-orange hover:text-brand-chocolate"
                    >
                      Edit
                    </Link>
                    <DeleteButton
                      url={`/api/admin/cakes/${cake.id}`}
                      confirmText={`Delete "${cake.name}"? This can't be undone.`}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cakes.length === 0 && (
        <p className="mt-6 font-body text-sm text-brand-chocolate/60">
          No cakes yet. Add your first one above.
        </p>
      )}
    </div>
  );
}
