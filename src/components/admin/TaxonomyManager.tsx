"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export type TaxonomyItem = { id: string; label: string };

/** Shared add/edit/delete list for a simple lookup table (flavors,
 * dietary tags, occasions) — each keyed by either a uuid (`id`) or a
 * stable text code (`code`), with a single editable display field
 * ("name" for flavors, "label" for tags/occasions). `bodyKey` picks
 * which JSON key the API route expects for that field. */
export function TaxonomyManager({
  apiBase,
  initialItems,
  bodyKey,
  placeholder,
  listKey,
}: {
  apiBase: string;
  initialItems: TaxonomyItem[];
  bodyKey: "name" | "label";
  placeholder: string;
  listKey: string;
}) {
  const [items, setItems] = useState(initialItems);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(data[listKey] ?? []);
  };

  const add = async () => {
    if (!draft.trim()) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [bodyKey]: draft.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAddError(data.error ?? "Couldn't add that.");
      setAdding(false);
      return;
    }
    setDraft("");
    await refresh();
    setAdding(false);
  };

  const startEdit = (item: TaxonomyItem) => {
    setEditingId(item.id);
    setEditValue(item.label);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    if (!editValue.trim()) return;
    setEditError(null);
    const res = await fetch(`${apiBase}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [bodyKey]: editValue.trim() }),
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
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="input-field flex-1"
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
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="input-field flex-1"
                  autoFocus
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
                <span className="flex-1 font-body text-sm text-brand-chocolate">{item.label}</span>
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
        message="Delete this? It can't be removed while any cake still uses it."
        onConfirm={() => confirmingId && remove(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
