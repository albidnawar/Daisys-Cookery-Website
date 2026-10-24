"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { OptionGroupCode } from "@/lib/admin/optionValuesAdmin";

export type OptionValueItem = { id: string; label: string; priceDelta: number };

/** Add/edit/delete list for one of the three customer-facing option
 * groups (Flavor, Cake color, Candles & toppers) this admin module covers
 * — each row carries an optional price (an extra charge added on top of
 * the cake's base price; see calculatePrice.ts), left blank or at 0 for a
 * free choice. */
export function OptionValuesManager({
  groupCode,
  initialItems,
  placeholder,
}: {
  groupCode: OptionGroupCode;
  initialItems: OptionValueItem[];
  placeholder: string;
}) {
  const apiBase = `/api/admin/option-values/${groupCode}`;
  const [items, setItems] = useState(initialItems);
  const [draftLabel, setDraftLabel] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(data.values ?? []);
  };

  const add = async () => {
    if (!draftLabel.trim()) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: draftLabel.trim(), priceDelta: Number(draftPrice) || 0 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAddError(data.error ?? "Couldn't add that.");
      setAdding(false);
      return;
    }
    setDraftLabel("");
    setDraftPrice("");
    await refresh();
    setAdding(false);
  };

  const startEdit = (item: OptionValueItem) => {
    setEditingId(item.id);
    setEditLabel(item.label);
    setEditPrice(item.priceDelta ? String(item.priceDelta) : "");
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    if (!editLabel.trim()) return;
    setEditError(null);
    const res = await fetch(`${apiBase}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel.trim(), priceDelta: Number(editPrice) || 0 }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditError(data.error ?? "Couldn't save that.");
      return;
    }
    setEditingId(null);
    await refresh();
  };

  const remove = async (id: string) => {
    setConfirmingId(null);
    setDeleteError(null);
    const res = await fetch(`${apiBase}/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Couldn't delete that.");
      return;
    }
    await refresh();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <input
          placeholder={placeholder}
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="input-field flex-1"
        />
        <input
          type="number"
          min={0}
          placeholder="Price (optional)"
          value={draftPrice}
          onChange={(e) => setDraftPrice(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="input-field w-40"
        />
        <Button type="button" variant="primary" onClick={add} disabled={adding}>
          Add
        </Button>
      </div>
      {addError && <p className="font-body text-sm text-red-600">{addError}</p>}

      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-2xl border-2 border-brand-chocolate/10 bg-white p-3"
          >
            {editingId === item.id ? (
              <>
                <input
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="input-field flex-1"
                  autoFocus
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Price"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="input-field w-32"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(item.id)}
                  className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="font-body text-sm text-brand-chocolate/60 hover:text-brand-orange"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 font-body text-sm text-brand-chocolate">
                  {item.label}
                  {item.priceDelta > 0 && (
                    <span className="ml-2 font-body text-xs font-bold text-brand-orange">
                      +৳{item.priceDelta.toLocaleString("en-BD")}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => startEdit(item)}
                  className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmingId(item.id)}
                  className="font-body text-sm font-bold text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
        {editError && <p className="font-body text-sm text-red-600">{editError}</p>}
        {deleteError && <p className="font-body text-sm text-red-600">{deleteError}</p>}
        {items.length === 0 && <p className="font-body text-sm text-brand-chocolate/60">None yet.</p>}
      </div>

      <ConfirmDialog
        open={confirmingId !== null}
        message="Delete this option? Past orders that already used it keep showing it on their receipt/slip."
        onConfirm={() => confirmingId && remove(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
