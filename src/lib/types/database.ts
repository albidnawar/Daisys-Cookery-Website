// Hand-written to match supabase/migrations/*.sql until a live Supabase
// project exists to generate this from directly:
//   npx supabase gen types typescript --project-id <id> > src/lib/types/database.ts
// Extend this file (don't hand-roll separate types) as later migrations
// add orders/slots/customers/notifications tables.

export type Database = {
  public: {
    Tables: {
      flavors: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["flavors"]["Row"]> & {
          name: string;
          slug: string;
        };
        Update: Partial<Database["public"]["Tables"]["flavors"]["Row"]>;
      };
      cakes: {
        Row: {
          id: string;
          slug: string;
          name: string;
          primary_flavor_id: string | null;
          description: string;
          short_description: string;
          base_price: number;
          hero_image_url: string | null;
          gallery_image_urls: string[];
          is_customisable: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["cakes"]["Row"]> & {
          slug: string;
          name: string;
          base_price: number;
        };
        Update: Partial<Database["public"]["Tables"]["cakes"]["Row"]>;
      };
      cake_dietary_tags: {
        Row: {
          cake_id: string;
          tag: "eggless" | "gluten_free" | "vegan" | "sugar_free";
        };
        Insert: Database["public"]["Tables"]["cake_dietary_tags"]["Row"];
        Update: Partial<Database["public"]["Tables"]["cake_dietary_tags"]["Row"]>;
      };
      option_groups: {
        Row: {
          id: string;
          code:
            | "size_lb"
            | "shape"
            | "tiers"
            | "sponge"
            | "cake_color"
            | "extras"
            | "allergen_swap"
            | "photo_print";
          label: string;
          input_type: "radio" | "segmented" | "checkbox_multi" | "number";
          min_select: number;
          max_select: number;
          sort_order: number;
        };
        Insert: Partial<Database["public"]["Tables"]["option_groups"]["Row"]> & {
          code: Database["public"]["Tables"]["option_groups"]["Row"]["code"];
          label: string;
          input_type: Database["public"]["Tables"]["option_groups"]["Row"]["input_type"];
        };
        Update: Partial<Database["public"]["Tables"]["option_groups"]["Row"]>;
      };
      option_values: {
        Row: {
          id: string;
          group_id: string;
          label: string;
          value_code: string;
          price_delta: number;
          sort_order: number;
          metadata: Record<string, unknown>;
        };
        Insert: Partial<Database["public"]["Tables"]["option_values"]["Row"]> & {
          group_id: string;
          label: string;
          value_code: string;
        };
        Update: Partial<Database["public"]["Tables"]["option_values"]["Row"]>;
      };
      cake_option_groups: {
        Row: {
          cake_id: string;
          option_group_id: string;
        };
        Insert: Database["public"]["Tables"]["cake_option_groups"]["Row"];
        Update: Partial<Database["public"]["Tables"]["cake_option_groups"]["Row"]>;
      };
    };
  };
};
