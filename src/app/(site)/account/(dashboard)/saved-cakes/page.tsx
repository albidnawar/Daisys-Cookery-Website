import Image from "next/image";
import Link from "next/link";
import { getCurrentCustomer } from "@/lib/customer/auth";
import { listSavedCakes } from "@/lib/customer/savedCakes";
import { SavedCakeRemoveButton } from "@/components/account/SavedCakeRemoveButton";
import { toObjectPosition } from "@/lib/image/focal";

export default async function SavedCakesPage() {
  const customer = await getCurrentCustomer();
  if (!customer) return null;

  const savedCakes = await listSavedCakes(customer.id);

  if (savedCakes.length === 0) {
    return (
      <p className="font-body text-sm text-brand-chocolate/60">
        No saved cakes yet. Tap &ldquo;Save&rdquo; on any cake&apos;s page to keep it here.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {savedCakes.map((saved) => (
        <div
          key={saved.id}
          className="flex flex-col gap-3 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-4"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-cream">
            {saved.cakeImageUrl && (
              <Image
                src={saved.cakeImageUrl}
                alt={saved.cakeName}
                fill
                className="object-cover"
                style={{ objectPosition: toObjectPosition(saved.cakeImageFocal) }}
              />
            )}
          </div>
          <Link
            href={`/cakes/${saved.cakeSlug}`}
            className="font-display text-base font-semibold text-brand-chocolate hover:text-brand-orange"
          >
            {saved.cakeName}
          </Link>
          <div className="flex items-center justify-between">
            <Link
              href={`/customise/${saved.cakeSlug}`}
              className="font-body text-xs font-bold text-brand-orange hover:text-brand-chocolate"
            >
              Order this →
            </Link>
            <SavedCakeRemoveButton savedCakeId={saved.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
