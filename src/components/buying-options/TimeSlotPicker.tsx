import { formatTimeAmPm } from "@/lib/dates";
import type { SlotAvailability } from "@/lib/types/domain";

const COPY = {
  en: {
    checking: "Checking availability…",
    noSlots: "No slots for that date yet. Try another day.",
    chosen: "chosen",
    full: "full",
    left: (remaining: number) => `${remaining} left`,
  },
  bn: {
    checking: "উপলভ্যতা যাচাই করা হচ্ছে…",
    noSlots: "এই তারিখে এখনো কোনো স্লট নেই। অন্য দিন চেষ্টা করুন।",
    chosen: "নির্বাচিত",
    full: "পূর্ণ",
    left: (remaining: number) => `${remaining}টি বাকি`,
  },
} as const;

export function TimeSlotPicker({
  slots,
  selectedSlotId,
  onSelect,
  loading,
  locale = "en",
}: {
  slots: SlotAvailability[];
  selectedSlotId: string | null;
  onSelect: (slot: SlotAvailability) => void;
  loading: boolean;
  locale?: "en" | "bn";
}) {
  const t = COPY[locale];
  if (loading) {
    return <p className="font-body text-sm text-brand-chocolate/60">{t.checking}</p>;
  }
  if (slots.length === 0) {
    return (
      <p className="font-body text-sm text-brand-chocolate/60">
        {t.noSlots}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {slots.map((slot) => {
        const isSelected = slot.slotId === selectedSlotId;
        const isFull = slot.status === "full" && !isSelected;
        return (
          <button
            key={slot.slotId}
            type="button"
            disabled={isFull}
            onClick={() => onSelect(slot)}
            className={`flex items-center justify-between rounded-full border-2 px-4 py-2.5 font-body text-sm font-bold ${
              isSelected
                ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
                : isFull
                  ? "cursor-not-allowed border-brand-chocolate/10 bg-white text-brand-chocolate/30"
                  : "border-brand-chocolate/10 bg-white text-brand-chocolate hover:border-brand-chocolate/25"
            }`}
          >
            <span>
              {formatTimeAmPm(slot.startTime)} – {formatTimeAmPm(slot.endTime)}
            </span>
            <span className="text-xs font-normal">
              {isSelected
                ? t.chosen
                : slot.status === "full"
                  ? t.full
                  : t.left(slot.remaining)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
