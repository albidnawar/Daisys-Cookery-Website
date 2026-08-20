import Link from "next/link";

export default function RootNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <span className="font-display text-7xl">🍰</span>
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
        This page fell off the tray
      </h1>
      <p className="max-w-md font-body text-sm text-brand-chocolate/70">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 font-body font-bold text-white shadow-md shadow-brand-orange/20 transition-colors hover:bg-brand-chocolate"
      >
        Back to Daisy&apos;s Cookery
      </Link>
    </div>
  );
}
