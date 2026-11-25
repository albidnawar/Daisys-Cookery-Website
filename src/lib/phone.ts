/** Canonicalizes a Bangladeshi phone number so the same number typed with
 * different spacing or a "+880"/"880" country-code prefix always compares
 * equal — e.g. "01712345678", "01712 345 678", and "+880 1712-345678" all
 * normalize to "01712345678". Apply this at every write to a phone column
 * (orders.contact_phone, customer_profiles.phone) and to the search input,
 * so lookups like the Manual Order Entry "Customer Lookup" and the
 * Customer Mini-CRM's per-phone grouping match regardless of how the
 * number was formatted when it was typed.
 *
 * Anything that doesn't look like a BD mobile number is left as
 * digits-only rather than rejected, since staff also use this box for the
 * odd landline or foreign number. */
export function normalizePhone(raw: string): string {
  let digits = raw.trim().replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("880")) {
    digits = "0" + digits.slice(3);
  } else if (digits.length === 10 && digits.startsWith("1")) {
    digits = "0" + digits;
  }
  // A customer sometimes types two numbers into the one phone field (e.g.
  // "01712345678, 01812345678" for an alternate contact) — stripping the
  // separator above then concatenates them into one long garbled digit
  // string. Detected by a second "01" sitting right after the first
  // 11-digit number; when that happens, keep only the first number rather
  // than storing the concatenation.
  if (digits.length > 11 && digits.startsWith("01") && /^01/.test(digits.slice(11))) {
    digits = digits.slice(0, 11);
  }
  return digits;
}
