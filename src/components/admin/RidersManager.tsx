"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Rider } from "@/lib/admin/ridersAdmin";

/** Add/edit/delete list for the saved delivery-rider directory — lets the
 * admin pick a rider's name/phone from here instead of retyping it on
 * every order (see the "Choose a saved rider" dropdown in
 * OrderDetailEditor.tsx). */
export function RidersManager({ initialItems }: { initialItems: Rider[] }) {
  const apiBase = "/api/admin/riders";
  const [items, setItems] = useState(initialItems);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = async () => {
    const res = await fetch(apiBase);
    const data = await res.json();
    setItems(data.riders ?? []);
  };

  const add = async () => {
    if (!draftName.trim() || !draftPhone.trim()) return;
    setAdding(true);
    setAddError(null);
    const res = await fetch(apiBase, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draftName.trim(), phone: draftPhone.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setAddError(data.error ?? "Couldn't add that.");
      setAdding(false);
      return;
    }
    setDraftName("");
    setDraftPhone("");
    await refresh();
    setAdding(false);
  };

  const startEdit = (item: Rider) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditPhone(item.phone);
    setEditError(null);
  };

  const saveEdit = async (id: string) => {
    if (!editName.trim() || !editPhone.trim()) return;
    setEditError(null);
    const res = await fetch(`${apiBase}/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName.trim(), phone: editPhone.trim() }),
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
          placeholder="Rider name"
          value={draftName}
          onChange={(e) => setDraftName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className="input-field flex-1"
        />
        <input
          placeholder="01XXXXXXXXX"
          value={draftPhone}
          onChange={(e) => setDraftPhone(e.target.value)}
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
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field flex-1"
                  autoFocus
                />
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="input-field w-40"
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
                  {item.name} <span className="text-brand-chocolate/50">· {item.phone}</span>
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
        message="Remove this rider from the saved list? Orders that already used them keep their name and phone as-is."
        onConfirm={() => confirmingId && remove(confirmingId)}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
