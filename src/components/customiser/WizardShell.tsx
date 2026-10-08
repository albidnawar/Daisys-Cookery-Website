"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SummaryPanel } from "@/components/customiser/SummaryPanel";
import { QuickOrderPanel } from "@/components/customiser/QuickOrderPanel";
import { StepSizeShapeTiers } from "@/components/customiser/steps/StepSizeShapeTiers";
import { StepSponge } from "@/components/customiser/steps/StepSponge";
import { StepFillingFinish } from "@/components/customiser/steps/StepFillingFinish";
import { StepMessageExtras } from "@/components/customiser/steps/StepMessageExtras";
import { Button } from "@/components/ui/Button";
import { calculatePrice } from "@/lib/pricing/calculatePrice";
import { getReferenceImages } from "@/lib/customiser/referenceImages";
import type { CakeDetail, DraftOrderSpec } from "@/lib/types/domain";

const STEP_TITLES = [
  "Size, shape & tiers",
  "Sponge flavor",
  "Filling & finish",
  "Message & extras",
];

export function WizardShell({
  cake,
  depositRate,
  isFromScratch,
}: {
  cake: CakeDetail;
  depositRate: number;
  isFromScratch: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isQuick = searchParams.get("mode") === "quick";

  const groupsByCode = Object.fromEntries(cake.optionGroups.map((g) => [g.code, g]));

  const [draftId, setDraftId] = useState<string | null>(searchParams.get("draft"));
  const [step, setStep] = useState(1);
  const [spec, setSpec] = useState<DraftOrderSpec>(
    isQuick
      ? { sizeCode: searchParams.get("size") ?? "1" }
      : {
          sizeCode: searchParams.get("size") ?? "1",
          shape: "round",
          tiers: "single",
        },
  );
  // calculatePrice is the exact same pure function the server runs (see
  // lib/pricing/calculatePrice.ts), so computing it here is already
  // "authoritative" for any given spec — no need to round-trip for a
  // number that would come back identical.
  const price = calculatePrice(cake, spec, depositRate);
  const patchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (draftId) return;
    fetch("/api/draft-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cakeSlug: cake.slug }),
    })
      .then((res) => res.json())
      .then(({ draft }) => {
        setDraftId(draft.id);
        const params = new URLSearchParams(searchParams.toString());
        params.set("draft", draft.id);
        router.replace(`?${params}`, { scroll: false });
      });
    // Only ever create a draft once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!draftId) return;

    if (patchTimer.current) clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(() => {
      fetch(`/api/draft-order/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spec }),
      }).catch(() => {});
    }, 300);
  }, [draftId, spec]);

  const patch = (p: Partial<DraftOrderSpec>) => setSpec((prev) => ({ ...prev, ...p }));

  if (isQuick) {
    return (
      <QuickOrderPanel
        cake={cake}
        draftId={draftId}
        spec={spec}
        price={price}
        onChange={patch}
      />
    );
  }

  return (
    <div className="grid gap-0 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="border-b-2 border-brand-chocolate/10 bg-white p-8 lg:border-b-0 lg:border-r-2">
        <SummaryPanel
          cakeName={cake.name}
          cakeImageUrl={cake.heroImageUrl}
          cakeImageFocal={cake.heroImageFocal}
          draftId={draftId}
          spec={spec}
          price={price}
          groupsByCode={groupsByCode}
          isFromScratch={isFromScratch}
          onReferenceImagesChange={(referenceImageUrls) => patch({ referenceImageUrls })}
          onInstructionsChange={(instructions) => patch({ instructions })}
        />
      </div>

      <div className="flex flex-col gap-8 p-8">
        <div>
          <span className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
            Step {step} of {STEP_TITLES.length}
          </span>
          <h2 className="mt-2 font-display text-4xl font-semibold text-brand-chocolate">
            {STEP_TITLES[step - 1]}
          </h2>
        </div>

        {step === 1 && (
          <StepSizeShapeTiers groupsByCode={groupsByCode} spec={spec} onChange={patch} />
        )}
        {step === 2 && (
          <StepSponge groupsByCode={groupsByCode} spec={spec} onChange={patch} />
        )}
        {step === 3 && (
          <StepFillingFinish groupsByCode={groupsByCode} spec={spec} onChange={patch} />
        )}
        {step === 4 && (
          <StepMessageExtras
            groupsByCode={groupsByCode}
            spec={spec}
            onChange={patch}
            hasReferenceImage={getReferenceImages(spec).length > 0}
          />
        )}

        <div className="mt-auto flex justify-between border-t border-brand-chocolate/10 pt-6">
          <Button
            variant="secondary"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            Back
          </Button>
          <Button
            variant="primary"
            disabled={step === STEP_TITLES.length}
            onClick={() => setStep((s) => Math.min(STEP_TITLES.length, s + 1))}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
