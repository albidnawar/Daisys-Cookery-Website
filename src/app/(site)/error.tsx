"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center sm:px-8">
      <span className="font-display text-6xl">😔</span>
      <h1 className="font-display text-3xl font-semibold text-brand-chocolate sm:text-4xl">
        Something went wrong
      </h1>
      <p className="max-w-md font-body text-sm leading-relaxed text-brand-chocolate/70">
        That&apos;s on us, not you — give it another try, or head back to the homepage.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/" className="font-body text-sm font-bold text-brand-chocolate/70 hover:text-brand-orange">
          Back to home →
        </Link>
      </div>
    </div>
  );
}
