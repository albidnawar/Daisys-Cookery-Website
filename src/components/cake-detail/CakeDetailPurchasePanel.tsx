"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SizeSelector } from "@/components/cake-detail/SizeSelector";
import { OrderViaChatButton } from "@/components/cake-detail/OrderViaChatButton";
import { Button, LinkButton } from "@/components/ui/Button";
import { depositLabel, type DepositConfig } from "@/lib/pricing/deposit";

export function CakeDetailPurchasePanel({
  slug,
  name,
  basePrice,
  deposit,
}: {
  slug: string;
  name: string;
  basePrice: number;
  deposit: DepositConfig;
}) {
  const router = useRouter();
  const [size, setSize] = useState("1");
  const parsedSize = Number(size);
  const lb = size && size !== "other" && Number.isFinite(parsedSize) && parsedSize > 0 ? parsedSize : null;
  const total = lb ? basePrice * lb : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-semibold text-brand-chocolate">
          ৳{(total ?? basePrice).toLocaleString("en-BD")}
        </span>
        <span className="font-body text-sm text-brand-chocolate/60">
          {lb ? `for ${lb} lb` : ""} &middot; ৳{basePrice.toLocaleString("en-BD")} per pound
        </span>
      </div>

      <SizeSelector value={size} onChange={setSize} />

      <div className="flex flex-col gap-3 pt-2 sm:flex-row">
        <LinkButton
          href={`/customise/${slug}?size=${size}`}
          variant="primary"
          className="flex-1"
        >
          Customise this cake
        </LinkButton>
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => router.push(`/customise/${slug}?size=${size}&mode=quick`)}
        >
          Add to basket
        </Button>
      </div>

      <OrderViaChatButton
        context={{ cakeName: name, weightLb: lb ?? undefined, price: total ?? basePrice }}
        className="w-full"
      />

      <p className="font-body text-xs text-brand-chocolate/60">
        A {depositLabel(deposit)} holds the date.
      </p>
    </div>
  );
}
