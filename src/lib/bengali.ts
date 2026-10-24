const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** "123" / 123 -> "১২৩" — digit-by-digit, leaves any non-digit characters
 * (e.g. a leading "+") untouched. */
export function toBengaliDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => BENGALI_DIGITS[Number(d)]);
}

/** "YYYY-MM-DD" (see toDateKey) -> "২৪/১০/২০২৬". */
export function formatBengaliDate(dateKey: string): string {
  const [year, month, day] = dateKey.split("-");
  return `${toBengaliDigits(day)}/${toBengaliDigits(month)}/${toBengaliDigits(year)}`;
}

/** Bangladeshi day-part convention used in courier/dispatch notes — not the
 * customer-facing am/pm house style (formatTimeAmPm). "18:00" -> "সন্ধ্যা ৬
 * টা", "07:30" -> "সকাল ৭:৩০ টা". Accepts "HH:MM" or "HH:MM:SS". */
export function formatBengaliTimeOfDay(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = Number(mStr ?? "0");

  let period: string;
  let hour12: number;
  if (h === 0) {
    period = "রাত";
    hour12 = 12;
  } else if (h < 4) {
    period = "রাত";
    hour12 = h;
  } else if (h < 6) {
    period = "ভোর";
    hour12 = h;
  } else if (h < 12) {
    period = "সকাল";
    hour12 = h;
  } else if (h === 12) {
    period = "দুপুর";
    hour12 = 12;
  } else if (h < 16) {
    period = "দুপুর";
    hour12 = h - 12;
  } else if (h < 18) {
    period = "বিকাল";
    hour12 = h - 12;
  } else if (h < 20) {
    period = "সন্ধ্যা";
    hour12 = h - 12;
  } else {
    period = "রাত";
    hour12 = h - 12;
  }

  const minutePart = m ? `:${toBengaliDigits(String(m).padStart(2, "0"))}` : "";
  return `${period} ${toBengaliDigits(hour12)}${minutePart} টা`;
}
