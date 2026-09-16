"use client";

import { useState } from "react";
import { toDateKey } from "@/lib/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function MonthCalendar({
  selectedDate,
  onSelect,
  isDateSelectable,
}: {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  isDateSelectable?: (dateKey: string) => boolean;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadingBlanks = firstOfMonth.getDay();

  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const changeMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="font-display text-xl text-brand-chocolate">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-chocolate/10 text-brand-chocolate hover:border-brand-chocolate/25"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-chocolate/10 text-brand-chocolate hover:border-brand-chocolate/25"
          >
            ›
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 overflow-hidden rounded-2xl border-2 border-brand-chocolate/10 bg-brand-chocolate/10 p-px">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-cream py-2 text-center font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60"
          >
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={i} className="aspect-square bg-white" />;
          const date = new Date(viewYear, viewMonth, day);
          const key = toDateKey(date);
          const isPast = date < today;
          const selectable = !isPast && (isDateSelectable ? isDateSelectable(key) : true);
          const isSelected = key === selectedDate;
          return (
            <button
              key={i}
              type="button"
              disabled={!selectable}
              onClick={() => onSelect(key)}
              className={`aspect-square font-body text-sm ${
                isSelected
                  ? "bg-brand-orange font-bold text-white"
                  : selectable
                    ? "bg-white text-brand-chocolate hover:bg-brand-orange/10"
                    : "bg-white text-brand-chocolate/25"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
