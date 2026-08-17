import type { EventCode } from "@/lib/catalog/events";

export type DietaryTag = "eggless" | "gluten_free" | "vegan" | "sugar_free";

export type Flavor = {
  id: string;
  name: string;
  slug: string;
};

export type CakeSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  heroImageUrl: string | null;
  flavor: Flavor | null;
  dietaryTags: DietaryTag[];
  events: EventCode[];
};

export type OptionValue = {
  id: string;
  label: string;
  valueCode: string;
  priceDelta: number;
  metadata: Record<string, unknown>;
};

export type OptionGroup = {
  id: string;
  code: string;
  label: string;
  inputType: "radio" | "segmented" | "checkbox_multi" | "number";
  minSelect: number;
  maxSelect: number;
  values: OptionValue[];
};

export type CakeDetail = CakeSummary & {
  description: string;
  galleryImageUrls: string[];
  isCustomisable: boolean;
  optionGroups: OptionGroup[];
};

export type CatalogFilters = {
  flavorSlug?: string;
  sizeLb?: number;
  dietary?: DietaryTag[];
  event?: EventCode;
  sort?: "price_asc" | "price_desc" | "name";
};

export type DraftOrderSpec = {
  sizeCode?: string; // "1".."5" or "other"
  shape?: string;
  tiers?: string;
  sponge?: string;
  filling?: string;
  frostingFinish?: string;
  extras?: string[];
  allergenSwap?: string[];
  photoPrint?: boolean;
  message?: string;
  referenceImageUrl?: string | null;
  instructions?: string;
};

export type PriceBreakdown = {
  subtotal: number;
  extrasTotal: number;
  total: number;
  depositAmount: number;
  balanceDue: number;
};

export type DraftOrder = {
  id: string;
  cakeSlug: string | null;
  spec: DraftOrderSpec;
  computedPrice: PriceBreakdown | null;
  fulfilmentType: "pickup" | "delivery" | null;
  zoneId: string | null;
  deliveryAddress: Record<string, unknown> | null;
  slotId: string | null;
  status: "active" | "converted" | "abandoned";
  createdAt: string;
  updatedAt: string;
};

export type DeliveryZone = {
  id: string;
  name: string;
  distanceBand: string;
  deliveryFee: number;
};

export type SlotAvailability = {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  fulfilmentType: "pickup" | "delivery";
  zoneId: string;
  capacity: number;
  remaining: number;
  status: "available" | "low" | "full";
};

export type PaymentMethod = "bkash" | "nagad" | "card" | "cash_on_collection";
export type PaymentStatus =
  | "pending"
  | "deposit_paid"
  | "paid_in_full"
  | "failed"
  | "refunded";
export type OrderStatus =
  | "received"
  | "confirmed"
  | "baking"
  | "ready"
  | "out_for_delivery"
  | "collected"
  | "delivered"
  | "cancelled";

export type CakeSnapshot = {
  name: string;
  slug: string | null;
  spec: DraftOrderSpec;
};

export type NotificationChannel = "sms" | "whatsapp" | "email";
export type NotificationType =
  | "order_confirmed"
  | "baking_in_progress"
  | "out_for_delivery"
  | "ready_for_collection";

export type Notification = {
  id: string;
  orderId: string;
  channel: NotificationChannel;
  type: NotificationType;
  payload: Record<string, unknown>;
  status: "queued" | "sent" | "failed";
  createdAt: string;
  sentAt: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  cakeSnapshot: CakeSnapshot;
  fulfilmentType: "pickup" | "delivery";
  zoneId: string;
  zoneName: string | null;
  deliveryAddress: Record<string, unknown> | null;
  slotId: string;
  slotLabel: string | null;
  subtotal: number;
  extrasTotal: number;
  deliveryFee: number;
  total: number;
  depositAmount: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  contactName: string;
  contactPhone: string;
  kitchenNote: string | null;
  createdAt: string;
};
