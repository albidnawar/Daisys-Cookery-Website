"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminError({
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
    <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white px-4 py-16 text-center">
      <h1 className="font-display text-2xl font-semibold text-brand-chocolate">
        Something went wrong
      </h1>
      <p className="max-w-md font-body text-sm text-brand-chocolate/70">
        This section hit an error. Try again, or refresh the page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
