"use client";

import { useEffect, useState, useTransition } from "react";
import { todayKey } from "@/lib/dates";

type CourierMessage = {
  id: string;
  orderNumber: string;
  customerPhone: string;
  hasRiderPickupTime: boolean;
  message: string;
};

export function CourierMessagesManager({ initialDate, initialMessages }: {
  initialDate: string;
  initialMessages: CourierMessage[];
}) {
  const [date, setDate] = useState(initialDate);
  const [messages, setMessages] = useState(initialMessages);
  const [loading, startLoading] = useTransition();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  useEffect(() => {
    startLoading(async () => {
      const res = await fetch(`/api/admin/courier-messages?date=${date}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    });
  }, [date]);

  const copy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  };

  const copyAll = () => {
    navigator.clipboard.writeText(messages.map((m) => m.message).join("\n\n---\n\n"));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-xl font-semibold text-brand-chocolate">Courier dispatch messages</h2>
        <label className="ml-auto flex items-center gap-2 font-body text-sm text-brand-chocolate">
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input-field w-auto"
          />
        </label>
        <button
          type="button"
          onClick={() => setDate(todayKey())}
          className="font-body text-sm font-bold text-brand-orange"
        >
          Today
        </button>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={copyAll}
            className="rounded-full bg-brand-orange px-4 py-2 font-body text-sm font-bold text-white hover:bg-brand-chocolate"
          >
            {copiedAll ? "Copied all!" : "Copy all"}
          </button>
        )}
        {loading && <span className="font-body text-xs text-brand-chocolate/50">Loading…</span>}
      </div>
      <p className="mb-4 font-body text-sm text-brand-chocolate/60">
        One ready-to-paste message per delivery order, built from the template below. Edit the
        template to change the boilerplate text that appears on every message.
      </p>

      {messages.length === 0 ? (
        <p className="font-body text-sm text-brand-chocolate/60">No delivery orders scheduled for this date.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {messages.map((m) => (
            <div key={m.id} className="rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="font-body text-xs font-bold uppercase tracking-widest text-brand-orange">
                  {m.orderNumber} &middot; {m.customerPhone}
                </p>
                <button
                  type="button"
                  onClick={() => copy(m.id, m.message)}
                  className="rounded-full bg-brand-orange px-4 py-1.5 font-body text-sm font-bold text-white hover:bg-brand-chocolate"
                >
                  {copiedId === m.id ? "Copied!" : "Copy"}
                </button>
              </div>
              {!m.hasRiderPickupTime && (
                <p className="mb-2 font-body text-xs font-bold text-red-600">
                  No rider pickup time set for this order yet — set it on the order&apos;s detail page
                  before sending, or the পিকআপ টাইম line will be blank.
                </p>
              )}
              <pre className="whitespace-pre-wrap rounded-xl bg-cream p-3 font-body text-xs text-brand-chocolate">
                {m.message}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
