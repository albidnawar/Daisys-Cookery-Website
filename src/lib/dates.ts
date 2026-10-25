/** Formats a Date as a local-calendar-day "YYYY-MM-DD" key. Deliberately
 * NOT `date.toISOString().slice(0, 10)` — that converts to UTC first, which
 * silently shifts the date by one for any timezone ahead of UTC (e.g.
 * Bangladesh, UTC+6) during local early-morning hours, making "today"
 * resolve to yesterday and showing no delivery slots at all. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

/** Formats a "HH:MM" or "HH:MM:SS" 24-hour time as a lowercase am/pm
 * label, e.g. "9 am" or "6:30 pm" — the one house style for a time of
 * day, used everywhere a slot's start/end time is shown to anyone
 * (customer or admin). */
export function formatTimeAmPm(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

const SLOT_LABEL_PATTERN = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})-(\d{2}:\d{2})$/;

/** Turns the raw, machine-parseable "YYYY-MM-DD HH:MM-HH:MM" slot label
 * (see formatSlotLabel in lib/slots/store.ts — kept in that exact shape
 * since AddToCalendarButton's own regex needs it) into a human-friendly,
 * am/pm date and time range for display. Falls back to the raw string
 * unchanged if it doesn't match that shape, so an unexpected value never
 * just disappears. */
export function formatSlotLabelForDisplay(slotLabel: string | null, fallback = "To be confirmed"): string {
  if (!slotLabel) return fallback;
  const match = SLOT_LABEL_PATTERN.exec(slotLabel);
  if (!match) return slotLabel;
  const [, date, start, end] = match;
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  // An exact-time booking stores start === end (see book_exact_time() in
  // 0032_local_delivery_and_exact_time_booking.sql) — show it as a single
  // time rather than a zero-width "4:30 pm–4:30 pm" range.
  const time = start === end ? formatTimeAmPm(start) : `${formatTimeAmPm(start)}–${formatTimeAmPm(end)}`;
  return `${formattedDate}, ${time}`;
}
