import type { EventCode } from "@/lib/catalog/events";
import type { FocalPoint } from "@/lib/image/focal";

// Dietary tag codes are admin-managed (see the `dietary_tags` table and
// src/lib/admin/taxonomyAdmin.ts) rather than a fixed compile-time list —
// this type is just a readability alias over the plain code string.
export type DietaryTag = string;

export type Flavor = {
  id: string;
  name: string;
  slug: string;
};

export type Review = {
  id: string;
  customerName: string;
  reviewText: string;
  cakeImageUrl: string | null;
  cakeImageFocal: FocalPoint;
  rating: number;
  reviewDate: string;
};

export type CakeSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  basePrice: number;
  heroImageUrl: string | null;
  heroImageFocal: FocalPoint;
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
  // Aligned by index with galleryImageUrls.
  galleryImageFocals: FocalPoint[];
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
  sizeCode?: string; // "1".."5", a custom typed weight, or the transient "other" sentinel
  shape?: string;
  tiers?: string;
  sponge?: string;
  filling?: string;
  frostingFinish?: string;
  extras?: string[];
  allergenSwap?: string[];
  photoPrint?: boolean;
  message?: string;
  cakeColor?: string;
  // Legacy single-image field — still read for historical orders and still
  // written by the admin's manual-order form. New code reads/writes
  // referenceImageUrls instead (see getReferenceImages() in
  // lib/customiser/referenceImages.ts).
  referenceImageUrl?: string | null;
  referenceImageUrls?: string[];
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
  customCakeName: string | null;
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

export type CustomQuoteStatus = "new" | "quoted" | "declined";

export type CustomQuoteSummary = {
  id: string;
  contactName: string;
  contactPhone: string;
  cakeTitle: string;
  status: CustomQuoteStatus;
  quotedPrice: number | null;
  referenceImageUrls: string[];
  createdAt: string;
};

export type CustomQuoteDetail = CustomQuoteSummary & {
  themeNotes: string | null;
  icingColors: string | null;
  quotedSizeNote: string | null;
  draftOrderId: string | null;
};

export type CustomQuoteInput = {
  contactName: string;
  contactPhone: string;
  cakeTitle: string;
  themeNotes: string | null;
  icingColors: string | null;
  referenceImageUrls: string[];
  quotedPrice: number | null;
  quotedSizeNote: string | null;
  status: CustomQuoteStatus;
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

export type CustomerProfile = {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  allergenDefaults: string[];
};

export type CustomerAddress = {
  id: string;
  label: string;
  text: string;
  isDefault: boolean;
};

export type SavedCake = {
  id: string;
  cakeId: string;
  cakeName: string;
  cakeSlug: string;
  cakeImageUrl: string | null;
  cakeImageFocal: FocalPoint;
  note: string | null;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
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
  orderSource: "web" | "manual";
  manualTrxId: string | null;
  needsRiderPickup: boolean;
  riderPickupAt: string | null;
  createdAt: string;
};
