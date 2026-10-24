// Dev-only stand-in for the Supabase catalog, used until a project is
// connected (see isSupabaseConfigured). Mirrors supabase/seed.sql so the UI
// looks the same either way; delete nothing here when Supabase comes
// online — queries.ts is simply preferred whenever it's configured.
import type { CakeDetail, CakeSummary, Flavor, OptionGroup } from "@/lib/types/domain";
import { DEFAULT_FOCAL } from "@/lib/image/focal";

function group(
  code: string,
  label: string,
  inputType: OptionGroup["inputType"],
  values: [string, string, number][],
  minSelect = 0,
  maxSelect = 1,
): OptionGroup {
  return {
    id: code,
    code,
    label,
    inputType,
    minSelect,
    maxSelect,
    values: values.map(([valueCode, valueLabel, priceDelta]) => ({
      id: `${code}:${valueCode}`,
      label: valueLabel,
      valueCode,
      priceDelta,
      metadata: {},
    })),
  };
}

// Mirrors supabase/seed.sql so the Customiser works identically before a
// Supabase project exists.
export const FIXTURE_OPTION_GROUPS: OptionGroup[] = [
  group("size_lb", "Size, in pounds", "segmented", [
    ["1", "1 lb", 0],
    ["2", "2 lb", 0],
    ["3", "3 lb", 0],
    ["4", "4 lb", 0],
    ["5", "5 lb", 0],
    ["other", "Other", 0],
  ], 1, 1),
  group("shape", "Shape", "radio", [
    ["round", "Round", 0],
    ["square", "Square", 0],
  ], 1, 1),
  group("tiers", "Tiers", "radio", [
    ["single", "Single", 0],
    ["two", "Two tier", 800],
    ["three", "Three tier", 1800],
  ], 1, 1),
  group(
    "sponge",
    "Flavor",
    "radio",
    FIXTURE_FLAVORS_SPONGE_VALUES(),
    1,
    1,
  ),
  group("cake_color", "Cake color", "radio", [
    ["white", "White", 0],
    ["pink", "Pink", 0],
    ["red", "Red", 0],
    ["gold", "Gold", 50],
  ], 0, 1),
  group("extras", "Candles & toppers", "checkbox_multi", [
    ["candles", "Candles x6", 50],
    ["sparkler", "Sparkler", 120],
    ["gold_topper", "Gold topper", 90],
    ["fresh_daisies", "Fresh daisies", 150],
    ["name_plaque", "Name plaque", 100],
  ], 0, 5),
  group("allergen_swap", "Allergen swaps", "checkbox_multi", [
    ["eggless", "Eggless sponge", 150],
    ["gluten_free", "Gluten-free flour", 250],
    ["vegan", "Vegan (no dairy)", 300],
    ["nut_free", "Nut-free kitchen run", 0],
  ], 0, 3),
  group("photo_print", "Photo print on cake", "checkbox_multi", [
    ["photo_print", "Print my reference photo on rice paper", 400],
  ], 0, 1),
];

function FIXTURE_FLAVORS_SPONGE_VALUES(): [string, string, number][] {
  return [
    ["vanilla", "Vanilla", 0],
    ["chocolate", "Chocolate", 0],
    ["black-forest", "Black Forest", 0],
    ["red-velvet", "Red Velvet", 0],
    ["butterscotch", "Butterscotch", 0],
    ["orange", "Orange", 0],
    ["mango", "Mango", 0],
    ["lemon", "Lemon", 0],
    ["strawberry", "Strawberry", 0],
    ["blueberry", "Blueberry", 0],
    ["pistachio", "Pistachio", 150],
  ];
}

// Dev-only stand-ins for the admin-managed `occasions`/`dietary_tags`
// tables (see taxonomyAdmin.ts) — used only when Supabase isn't
// configured, so there's no lookup table to read these from.
export const FIXTURE_EVENT_OPTIONS = [
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

export const FIXTURE_DIETARY_OPTIONS = [
  { code: "eggless", label: "Eggless" },
  { code: "gluten_free", label: "Gluten-free" },
  { code: "vegan", label: "Vegan" },
  { code: "sugar_free", label: "Sugar-free" },
];

export const FIXTURE_FLAVORS: Flavor[] = [
  { id: "vanilla", name: "Vanilla", slug: "vanilla" },
  { id: "chocolate", name: "Chocolate", slug: "chocolate" },
  { id: "black-forest", name: "Black Forest", slug: "black-forest" },
  { id: "red-velvet", name: "Red Velvet", slug: "red-velvet" },
  { id: "butterscotch", name: "Butterscotch", slug: "butterscotch" },
  { id: "orange", name: "Orange", slug: "orange" },
  { id: "mango", name: "Mango", slug: "mango" },
  { id: "lemon", name: "Lemon", slug: "lemon" },
  { id: "strawberry", name: "Strawberry", slug: "strawberry" },
  { id: "blueberry", name: "Blueberry", slug: "blueberry" },
  { id: "pistachio", name: "Pistachio", slug: "pistachio" },
];

export const FIXTURE_CAKES: CakeSummary[] = [
  {
    id: "the-vanilla-bean",
    slug: "the-vanilla-bean",
    name: "The Vanilla Bean",
    shortDescription: "Bourbon vanilla sponge, whipped cream, a plain gold band.",
    basePrice: 1150,
    heroImageUrl: null,
    heroImageFocal: DEFAULT_FOCAL,
    flavor: FIXTURE_FLAVORS[0],
    dietaryTags: [],
    events: ["birthday", "kids_character"],
  },
  {
    id: "dark-chocolate-ganache",
    slug: "dark-chocolate-ganache",
    name: "Dark Chocolate Ganache",
    shortDescription: "Dark sponge, ganache between the layers, cocoa dusted.",
    basePrice: 1250,
    heroImageUrl: null,
    heroImageFocal: DEFAULT_FOCAL,
    flavor: FIXTURE_FLAVORS[1],
    dietaryTags: [],
    events: ["birthday", "corporate_office"],
  },
  {
    id: "the-winter-gateau",
    slug: "the-winter-gateau",
    name: "The Winter Gateau",
    shortDescription: "Cherries, cream and shaved chocolate. Two pounds serves eight.",
    basePrice: 1400,
    heroImageUrl: null,
    heroImageFocal: DEFAULT_FOCAL,
    flavor: FIXTURE_FLAVORS[2],
    dietaryTags: ["eggless", "gluten_free"],
    events: ["birthday", "anniversary_romance"],
  },
  {
    id: "daisys-velvet",
    slug: "daisys-velvet",
    name: "Daisy's Velvet",
    shortDescription: "Cream cheese between three layers, crumbed all round.",
    basePrice: 1350,
    heroImageUrl: null,
    heroImageFocal: DEFAULT_FOCAL,
    flavor: FIXTURE_FLAVORS[3],
    dietaryTags: ["eggless"],
    events: ["anniversary_romance", "valentines_mothers_fathers_day"],
  },
];

export function getFixtureCakeDetail(slug: string): CakeDetail | null {
  const summary = FIXTURE_CAKES.find((c) => c.slug === slug);
  if (!summary) return null;
  return {
    ...summary,
    description: `${summary.shortDescription} Kept cold until you collect it; best eaten the same day.`,
    galleryImageUrls: [],
    galleryImageFocals: [],
    isCustomisable: true,
    optionGroups: FIXTURE_OPTION_GROUPS,
  };
}
