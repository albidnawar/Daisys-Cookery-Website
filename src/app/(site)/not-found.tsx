import Link from "next/link";
import { LinkButton } from "@/components/ui/Button";

export default function SiteNotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-8">
      <span className="font-display text-7xl">🍰</span>
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate sm:text-4xl">
        This page fell off the tray
      </h1>
      <p className="max-w-md font-body text-sm leading-relaxed text-brand-chocolate/70">
        We couldn&apos;t find what you were looking for — it may have been moved, or the
        link might be off.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/browse">Browse the cakes</LinkButton>
        <Link
          href="/"
          className="font-body text-sm font-bold text-brand-chocolate/70 hover:text-brand-orange"
        >
          Back to home →
        </Link>
      </div>
    </div>
  );
}
