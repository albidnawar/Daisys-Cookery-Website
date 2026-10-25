"use client";

import { Button } from "@/components/ui/Button";

function parseSlotLabel(slotLabel: string): { start: Date; end: Date } | null {
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})-(\d{2}:\d{2})$/.exec(slotLabel);
  if (!match) return null;
  const [, date, startTime, endTime] = match;
  return {
    start: new Date(`${date}T${startTime}:00`),
    end: new Date(`${date}T${endTime}:00`),
  };
}

function toIcsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

export function AddToCalendarButton({
  orderNumber,
  summary,
  location,
  slotLabel,
}: {
  orderNumber: string;
  summary: string;
  location: string;
  slotLabel: string | null;
}) {
  const handleClick = () => {
    if (!slotLabel) return;
    const parsed = parseSlotLabel(slotLabel);
    if (!parsed) return;

    // An exact-time booking's start === end (a point in time, not a
    // window) — give the calendar event a sensible 30-minute duration
    // instead of a zero-length one.
    const end = parsed.end.getTime() === parsed.start.getTime()
      ? new Date(parsed.start.getTime() + 30 * 60_000)
      : parsed.end;

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Daisy's Cookery//Order//EN",
      "BEGIN:VEVENT",
      `UID:${orderNumber}@daisyscookery`,
      `DTSTAMP:${toIcsDate(new Date())}`,
      `DTSTART:${toIcsDate(parsed.start)}`,
      `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${summary}`,
      `LOCATION:${location}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${orderNumber}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="ghost" onClick={handleClick} disabled={!slotLabel}>
      Add to calendar
    </Button>
  );
}
