"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BasketLineItem } from "@/components/checkout/BasketLineItem";
import { ContactFieldsForm, type ContactFields } from "@/components/checkout/ContactFieldsForm";
import { PaymentMethodChooser } from "@/components/checkout/PaymentMethodChooser";
import { OrderSummaryAside } from "@/components/checkout/OrderSummaryAside";
import type { DraftOrder, OptionGroup, PaymentMethod, PriceBreakdown } from "@/lib/types/domain";

export function CheckoutClient({
  draft,
  cakeName,
  cakeSlug,
  optionGroups,
  price,
  fulfilmentLabel,
}: {
  draft: DraftOrder;
  cakeName: string;
  cakeSlug: string | null;
  optionGroups: OptionGroup[];
  price: PriceBreakdown;
  fulfilmentLabel: string;
}) {
  const router = useRouter();
  const [contact, setContact] = useState<ContactFields>({ name: "", phone: "", kitchenNote: "" });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bkash");
  const [manualTrxId, setManualTrxId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsTrxId = paymentMethod === "bkash" || paymentMethod === "nagad";

  const handleSubmit = async () => {
    if (!contact.name || !contact.phone) {
      setError("Name and phone are required.");
      return;
    }
    if (needsTrxId && !manualTrxId.trim()) {
      setError("Enter the number you sent the deposit from.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: draft.id,
          contactName: contact.name,
          contactPhone: contact.phone,
          kitchenNote: contact.kitchenNote,
          paymentMethod,
          manualTrxId: needsTrxId ? manualTrxId.trim() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't place the order. Try again.");
        setSubmitting(false);
        return;
      }
      router.push(`/confirmation/${data.order.id}`);
    } catch {
      setError("Couldn't place the order. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]">
      <div className="flex flex-col gap-8">
        <BasketLineItem
          cakeName={cakeName}
          cakeSlug={cakeSlug}
          optionGroups={optionGroups}
          spec={draft.spec}
          price={price.subtotal + price.extrasTotal}
          draftId={draft.id}
        />
        <ContactFieldsForm value={contact} onChange={setContact} />
        <PaymentMethodChooser
          value={paymentMethod}
          onChange={setPaymentMethod}
          depositAmount={price.depositAmount}
          manualTrxId={manualTrxId}
          onTrxIdChange={setManualTrxId}
        />
      </div>
      <OrderSummaryAside
        price={price}
        deliveryFee={price.total - (price.subtotal + price.extrasTotal)}
        fulfilmentLabel={fulfilmentLabel}
        onSubmit={handleSubmit}
        submitting={submitting}
        error={error}
      />
    </div>
  );
}
