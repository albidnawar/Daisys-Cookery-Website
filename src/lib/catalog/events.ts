export type EventCode =
  | "birthday"
  | "anniversary_romance"
  | "wedding_gaye_holud"
  | "engagement_ring"
  | "baby_shower_sadh"
  | "graduation_success"
  | "eid_festive"
  | "valentines_mothers_fathers_day"
  | "corporate_office"
  | "kids_character";

export const EVENT_OPTIONS: { code: EventCode; label: string }[] = [
  { code: "birthday", label: "Birthday (Kids & Adults)" },
  { code: "anniversary_romance", label: "Anniversary & Romance" },
  { code: "wedding_gaye_holud", label: "Wedding & Gaye Holud" },
  { code: "engagement_ring", label: "Engagement & Ring Ceremony" },
  { code: "baby_shower_sadh", label: "Baby Shower & Sadh" },
  { code: "graduation_success", label: "Graduation & Success" },
  { code: "eid_festive", label: "Eid & Festive Specials" },
  { code: "valentines_mothers_fathers_day", label: "Valentine's & Mother's/Father's Day" },
  { code: "corporate_office", label: "Corporate & Office Parties" },
  { code: "kids_character", label: "Kids & Character Themes" },
];

export const EVENT_LABELS: Record<EventCode, string> = Object.fromEntries(
  EVENT_OPTIONS.map((o) => [o.code, o.label]),
) as Record<EventCode, string>;
