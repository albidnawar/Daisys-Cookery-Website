import type { SlotAvailability } from "@/lib/types/domain";

function formatTime(t: string) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export function TimeSlotPicker({
  slots,
  selectedSlotId,
  onSelect,
  loading,
}: {
  slots: SlotAvailability[];
  selectedSlotId: string | null;
  onSelect: (slot: SlotAvailability) => void;
  loading: boolean;
}) {
  if (loading) {
    return <p className="font-body text-sm text-brand-chocolate/60">Checking availability…</p>;
  }
  if (slots.length === 0) {
    return (
      <p className="font-body text-sm text-brand-chocolate/60">
        No slots for that date yet. Try another day.
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
              {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
            </span>
            <span className="text-xs font-normal">
              {isSelected
                ? "chosen"
                : slot.status === "full"
                  ? "full"
                  : `${slot.remaining} left`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
