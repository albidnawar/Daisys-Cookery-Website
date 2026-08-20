"use client";

import Link from "next/link";

export default function RootError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <span className="font-display text-6xl">😔</span>
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate">
        Something went wrong
      </h1>
      <p className="max-w-md font-body text-sm text-brand-chocolate/70">
        Give it another try, or head back to the homepage.
      </p>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-orange px-6 py-3 font-body font-bold text-white shadow-md shadow-brand-orange/20 transition-colors hover:bg-brand-chocolate"
        >
          Try again
        </button>
        <Link href="/" className="font-body text-sm font-bold text-brand-chocolate/70 hover:text-brand-orange">
          Go home →
        </Link>
      </div>
    </div>
  );
}
