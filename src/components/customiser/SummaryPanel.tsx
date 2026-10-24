"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button, LinkButton } from "@/components/ui/Button";
import { ReferenceImageDropzone } from "@/components/customiser/ReferenceImageDropzone";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import { buildChatLink } from "@/lib/chat/buildChatLink";
import { toObjectPosition, type FocalPoint } from "@/lib/image/focal";
import type { DraftOrderSpec, OptionGroup, PriceBreakdown } from "@/lib/types/domain";

function labelFor(groupsByCode: Record<string, OptionGroup>, code: string, valueCode?: string) {
  if (!valueCode) return "-";
  return (
    groupsByCode[code]?.values.find((v) => v.valueCode === valueCode)?.label ??
    valueCode
  );
}

export function SummaryPanel({
  cakeName,
  cakeImageUrl,
  cakeImageFocal,
  draftId,
  spec,
  price,
  groupsByCode,
  isFromScratch,
  onReferenceImagesChange,
  onInstructionsChange,
}: {
  cakeName: string;
  cakeImageUrl: string | null;
  cakeImageFocal: FocalPoint | undefined;
  draftId: string | null;
  spec: DraftOrderSpec;
  price: PriceBreakdown | null;
  groupsByCode: Record<string, OptionGroup>;
  isFromScratch: boolean;
  onReferenceImagesChange: (urls: string[]) => void;
  onInstructionsChange: (value: string) => void;
}) {
  const sizeLabel = spec.sizeCode
    ? labelFor(groupsByCode, "size_lb", spec.sizeCode)
    : "-";
  const extrasLabels = (spec.extras ?? [])
    .map((code) => labelFor(groupsByCode, "extras", code))
    .join(", ");
  const referenceImages = getReferenceImages(spec);
  const wantsCustomQuote = isFromScratch && referenceImages.length > 0;

  return (
    <div className="flex flex-col gap-4">
      <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
        Your cake so far
      </span>

      {cakeImageUrl && (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl border-2 border-brand-chocolate/10 bg-cream">
          <Image
            src={cakeImageUrl}
            alt={cakeName}
            fill
            className="object-cover"
            style={{ objectPosition: toObjectPosition(cakeImageFocal) }}
          />
        </div>
      )}

      <ReferenceImageDropzone
        draftId={draftId}
        imageUrls={referenceImages}
        maxImages={isFromScratch ? 6 : 3}
        instructions={spec.instructions}
        onChange={onReferenceImagesChange}
        onInstructionsChange={onInstructionsChange}
      />

      <h3 className="font-display text-2xl font-semibold text-brand-chocolate">
        {isFromScratch
          ? sizeLabel !== "-"
            ? `${sizeLabel} custom cake`
            : "Your custom cake"
          : `${sizeLabel !== "-" ? `${sizeLabel} ` : ""}${cakeName}`}
      </h3>

      <table className="w-full font-body text-sm">
        <tbody>
          <Row label="Flavor" value={labelFor(groupsByCode, "sponge", spec.sponge)} />
          <Row label="Message" value={spec.message || "-"} />
          <Row label="Extras" value={extrasLabels || "-"} />
        </tbody>
      </table>

      {wantsCustomQuote ? (
        <div className="border-t border-brand-chocolate/10 pt-3">
          <CustomQuoteSubmit draftId={draftId} spec={spec} referenceImages={referenceImages} />
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between border-t border-brand-chocolate/10 pt-3">
            <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              Total
            </span>
            <span className="font-display text-3xl font-semibold text-brand-chocolate">
              {price ? `৳${price.total.toLocaleString("en-BD")}` : "Call for a quote"}
            </span>
          </div>

          {draftId ? (
            <LinkButton
              href={`/buying-options?draft=${draftId}`}
              variant="primary"
              className="w-full"
            >
              Choose pickup or delivery
            </LinkButton>
          ) : (
            <Link
              href="#"
              className="pointer-events-none w-full rounded-full bg-brand-chocolate/20 px-6 py-3 text-center font-body font-bold text-white"
            >
              Choose pickup or delivery
            </Link>
          )}
        </>
      )}
    </div>
  );
}

function CustomQuoteSubmit({
  draftId,
  spec,
  referenceImages,
}: {
  draftId: string | null;
  spec: DraftOrderSpec;
  referenceImages: string[];
}) {
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"form" | "submitted" | "ready-to-send">("form");
  const [requestId, setRequestId] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (!contactName.trim() || !contactPhone.trim()) {
      setError("Please add your name and phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/custom-quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          contactPhone,
          cakeTitle: spec.message || "Custom cake design",
          themeNotes: spec.instructions ?? null,
          quotedSizeNote:
            spec.sizeCode && spec.sizeCode !== "other" ? `approx ${spec.sizeCode} lb` : null,
          referenceImageUrls: referenceImages,
          draftOrderId: draftId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't submit your request");
      setRequestId(data.id);
      setStep("submitted");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your request");
    } finally {
      setSubmitting(false);
    }
  };

  if (step === "submitted" && requestId) {
    return (
      <div className="flex flex-col gap-3">
        <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
          Request sent
        </p>
        <p className="font-body text-sm text-brand-chocolate/80">
          Your request ID is{" "}
          <span className="font-bold text-brand-chocolate">{requestId}</span>. Keep it handy —
          it&apos;s how we&apos;ll find your design.
        </p>
        <Button type="button" variant="primary" className="w-full" onClick={() => setStep("ready-to-send")}>
          Continue
        </Button>
      </div>
    );
  }

  if (step === "ready-to-send" && requestId) {
    return (
      <div className="flex flex-col gap-3">
        <a
          href={buildChatLink("whatsapp", {
            cakeName: spec.message || "Custom cake design",
            requestId,
          })}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-orange px-5 py-3 text-center font-body text-sm font-bold text-white shadow-md shadow-brand-orange/20 hover:bg-brand-chocolate"
        >
          Send via WhatsApp
        </a>
        <Link
          href={`/quote/${requestId}`}
          className="text-center font-body text-xs text-brand-chocolate/50 hover:text-brand-orange"
        >
          Check your quote status later
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-full border-2 border-brand-chocolate/10 bg-white px-4 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
      />
      <input
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        placeholder="Phone / WhatsApp number"
        className="w-full rounded-full border-2 border-brand-chocolate/10 bg-white px-4 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
      />
      {error && <p className="font-body text-xs text-red-600">{error}</p>}
      <Button
        type="button"
        variant="primary"
        className="w-full"
        disabled={submitting || !draftId}
        onClick={submit}
      >
        {submitting ? "Sending…" : "Get quotation"}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td className="py-1 text-brand-chocolate/60">{label}</td>
      <td className="py-1 text-right text-brand-chocolate">{value}</td>
    </tr>
  );
}
