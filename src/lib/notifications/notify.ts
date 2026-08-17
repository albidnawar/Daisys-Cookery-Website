import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/isConfigured";
import { readJson, withFileLock, writeJson } from "@/lib/devStore/fileStore";
import type { Notification, NotificationType, OrderStatus } from "@/lib/types/domain";

const STORE_NAME = "notifications";

// Which order-status transitions are worth telling the customer about,
// and what the message template is keyed by. Statuses not listed here
// (e.g. 'confirmed', 'delivered', 'cancelled') don't send anything in
// this build — add them the same way once there's a real channel wired up.
const STATUS_TO_TYPE: Partial<Record<OrderStatus, NotificationType>> = {
  received: "order_confirmed",
  baking: "baking_in_progress",
  out_for_delivery: "out_for_delivery",
  ready: "ready_for_collection",
};

async function readAll(): Promise<Notification[]> {
  return readJson<Notification[]>(STORE_NAME, []);
}

async function append(notification: Notification): Promise<void> {
  await withFileLock(STORE_NAME, async () => {
    const all = await readAll();
    all.push(notification);
    await writeJson(STORE_NAME, all);
  });
}

/** Called from an order-status transition (order creation today; staff/
 * admin status updates once that UI exists). Logs a notification row and
 * immediately marks it "sent" — see the module comment on why sending
 * itself is stubbed. Never throws: a notification failure shouldn't be
 * able to block the order flow that triggered it. */
export async function notifyOrderStatusChange(
  orderId: string,
  newStatus: OrderStatus,
): Promise<void> {
  const type = STATUS_TO_TYPE[newStatus];
  if (!type) return;

  const notification: Notification = {
    id: randomUUID(),
    orderId,
    channel: "whatsapp",
    type,
    payload: { status: newStatus },
    status: "queued",
    createdAt: new Date().toISOString(),
    sentAt: null,
  };

  try {
    if (isSupabaseConfigured()) {
      const supabase = await createServiceRoleClient();
      await supabase.from("notifications").insert({
        id: notification.id,
        order_id: orderId,
        channel: notification.channel,
        type,
        payload: notification.payload,
        status: "queued",
        created_at: notification.createdAt,
      });
    } else {
      await append(notification);
    }

    console.log(`[notify] would send ${type} for order ${orderId} via whatsapp`);
    await markSent(notification.id, orderId);
  } catch (error) {
    console.error("[notify] failed to record notification", error);
  }
}

async function markSent(id: string, orderId: string): Promise<void> {
  const sentAt = new Date().toISOString();
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    await supabase.from("notifications").update({ status: "sent", sent_at: sentAt }).eq("id", id);
    return;
  }
  await withFileLock(STORE_NAME, async () => {
    const all = await readAll();
    const found = all.find((n) => n.id === id && n.orderId === orderId);
    if (found) {
      found.status = "sent";
      found.sentAt = sentAt;
    }
    await writeJson(STORE_NAME, all);
  });
}

export async function listNotificationsForOrder(orderId: string): Promise<Notification[]> {
  if (isSupabaseConfigured()) {
    const supabase = await createServiceRoleClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("order_id", orderId);
    if (error) throw error;
    return data.map((row) => ({
      id: row.id,
      orderId: row.order_id,
      channel: row.channel,
      type: row.type,
      payload: row.payload,
      status: row.status,
      createdAt: row.created_at,
      sentAt: row.sent_at,
    }));
  }
  const all = await readAll();
  return all.filter((n) => n.orderId === orderId);
}
