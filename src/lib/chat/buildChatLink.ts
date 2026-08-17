export type ChatChannel = "whatsapp" | "messenger";

export type ChatContext = {
  cakeName?: string;
  weightLb?: number | string;
  price?: number;
  dateLabel?: string;
};

// Placeholders until real business identifiers are set in .env.local — see
// .env.local.example. Swapping the env vars later requires no code change.
const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "8801000000000";
const FACEBOOK_PAGE_USERNAME =
  process.env.NEXT_PUBLIC_FACEBOOK_PAGE_USERNAME || "daisyscookery";

function buildMessage(context: ChatContext): string {
  if (!context.cakeName) {
    return "Hi Daisy's Cookery! I have a question about a cake.";
  }
  const parts = [`Hi Daisy's Cookery! I'm interested in: ${context.cakeName}`];
  if (context.weightLb) parts.push(`${context.weightLb} lb`);
  if (context.price) parts.push(`~৳${context.price.toLocaleString("en-BD")}`);
  let message = parts.join(", ") + ".";
  if (context.dateLabel) {
    message += ` Preferred date: ${context.dateLabel}.`;
  }
  return message;
}

/** Builds a deep link that opens WhatsApp/Messenger with a prefilled
 * message. Messenger's m.me links don't support prefilled text the way
 * wa.me does (only a `ref` param a Page's inbox/bot can read), so for
 * Messenger we only carry a short ref and rely on WhatsApp for anything
 * that needs the full cake/order context to show up pre-typed. */
export function buildChatLink(
  channel: ChatChannel,
  context: ChatContext = {},
): string {
  if (channel === "messenger") {
    const ref = context.cakeName
      ? encodeURIComponent(context.cakeName.slice(0, 100))
      : "";
    return `https://m.me/${FACEBOOK_PAGE_USERNAME}${ref ? `?ref=${ref}` : ""}`;
  }

  const message = buildMessage(context);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
