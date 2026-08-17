import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-brand-chocolate/10 bg-white/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Daisy's Cookery" width={40} height={40} className="h-10 w-10" />
          <div>
            <p className="font-display text-lg font-semibold text-brand-chocolate">
              Daisy&apos;s Cookery
            </p>
            <p className="mt-1 font-body text-sm text-brand-chocolate/70">
              Baked to order &middot; Sanmar Santino, Devpahar, College Road, Chattogram &middot; 01814438989
            </p>
          </div>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 font-body text-sm text-brand-chocolate/80">
          <Link href="/browse" className="hover:text-brand-orange">
            Cakes
          </Link>
          <Link href="/customise/new" className="hover:text-brand-orange">
            Customise
          </Link>
          <Link href="/buying-options" className="hover:text-brand-orange">
            Pickup &amp; delivery
          </Link>
          <Link href="/account" className="hover:text-brand-orange">
            My orders
          </Link>
        </nav>
      </div>
    </footer>
  );
}
