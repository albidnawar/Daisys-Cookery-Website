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
