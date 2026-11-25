/** Buckets an order's freeform text (cake name, icing message, theme
 * notes) into a small set of occasions, for a quick "what was this cake
 * for" tag on the Customers CRM — a coarser, human-labeled cousin of the
 * keyword ranking in lib/admin/analytics.ts. Substring matching (not
 * tokenized) on purpose, so Banglish spellings ("biye" for wedding) and
 * partial words ("bday") still hit without needing every inflection
 * spelled out. First matching category wins; an order can only carry one
 * tag here. */
const EVENT_CATEGORIES: { label: string; keywords: string[] }[] = [
  { label: "Wedding", keywords: ["wedding", "married", "marriage", "bride", "groom", "biye", "walima", "holud", "mehedi", "mehendi"] },
  { label: "Engagement", keywords: ["engagement", "ring ceremony", "angti"] },
  { label: "Anniversary", keywords: ["anniversary", "anniversery"] },
  { label: "Birthday", keywords: ["birthday", "bday", "jonmodin", "turns ", "turning "] },
  { label: "Baby / newborn", keywords: ["baby shower", "babyshower", "newborn", "christening", "aqiqah", "akika", "gender reveal"] },
  { label: "Graduation", keywords: ["graduation", "graduate", "convocation"] },
  { label: "Achievement", keywords: ["congratulation", "congrats", "proud of you", "promotion", "promoted"] },
  { label: "Religious", keywords: ["eid", "ramadan", "milad", "puja", "christmas"] },
  { label: "Corporate", keywords: ["office", "corporate", "farewell", "retirement", "annual day", "goodbye"] },
  { label: "Housewarming", keywords: ["housewarming", "house warming", "new home", "newhome"] },
  { label: "Valentine's", keywords: ["valentine"] },
];

export function categorizeOrderEvent(text: string): string | null {
  const lower = text.toLowerCase();
  for (const category of EVENT_CATEGORIES) {
    if (category.keywords.some((keyword) => lower.includes(keyword))) return category.label;
  }
  return null;
}
