"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton() {
  return (
    <Button variant="primary" onClick={() => window.print()} className="print:hidden">
      Print
    </Button>
  );
}
