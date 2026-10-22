import type { CakeSnapshot, OrderStatus } from "@/lib/types/domain";

// Split out from ordersAdmin.ts because that module pulls in the
// service-role Supabase client (server-only, holds the secret key) —
// OrdersKanban.tsx is a Client Component and can only safely import this
// plain constant, not anything from that module.
export const KANBAN_COLUMNS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "pending", label: "Pending Approval", statuses: ["received"] },
  { key: "deposit_verified", label: "Deposit Verified", statuses: ["confirmed"] },
  { key: "baking", label: "Baking/Decorating", statuses: ["baking"] },
  { key: "ready", label: "Ready for Pickup/Delivery", statuses: ["ready", "out_for_delivery"] },
  { key: "completed", label: "Completed", statuses: ["collected", "delivered"] },
];

// Also used by the order-detail page's status dropdown, not just Kanban.
export const ALL_ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "received", label: "Received (pending approval)" },
  { value: "confirmed", label: "Confirmed (deposit verified)" },
  { value: "baking", label: "Baking/decorating" },
  { value: "ready", label: "Ready for pickup" },
  { value: "out_for_delivery", label: "Out for delivery" },
  { value: "collected", label: "Collected" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export type KanbanOrder = {
  id: string;
  orderNumber: string;
  cakeName: string;
  cakeSlug: string | null;
  cakeImageUrl: string | null;
  spec: CakeSnapshot["spec"];
  total: number;
  depositAmount: number;
  balanceDue: number;
  paymentStatus: string;
  status: OrderStatus;
  orderSource: "web" | "manual";
  fulfilmentType: "pickup" | "delivery";
  slotDate: string | null;
  /** Raw "HH:MM:SS" start time — kept separate from slotLabel (which is
   * formatted for display) so cards can be sorted chronologically without
   * re-parsing a human-readable string. */
  slotStartTime: string | null;
  slotLabel: string | null;
  contactName: string;
  contactPhone: string;
  riderName: string | null;
  riderPhone: string | null;
};
