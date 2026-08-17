import type { ReactNode } from "react";

export type ContactFields = {
  name: string;
  phone: string;
  kitchenNote: string;
};

export function ContactFieldsForm({
  value,
  onChange,
}: {
  value: ContactFields;
  onChange: (next: ContactFields) => void;
}) {
  return (
    <div>
      <h3 className="mb-4 font-display text-2xl font-semibold text-brand-chocolate">
        Who is collecting
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input
            type="text"
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-3 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
          />
        </Field>
        <Field label="Phone">
          <input
            type="tel"
            value={value.phone}
            onChange={(e) => onChange({ ...value, phone: e.target.value })}
            placeholder="01712 345 678"
            className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-3 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Note for the kitchen">
            <textarea
              value={value.kitchenNote}
              onChange={(e) => onChange({ ...value, kitchenNote: e.target.value })}
              placeholder="Anything we should know?"
              rows={2}
              className="w-full rounded-2xl border-2 border-brand-chocolate/10 bg-white px-3 py-2 font-body text-sm text-brand-chocolate outline-none focus:border-brand-orange"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
        {label}
      </span>
      {children}
    </label>
  );
}
