"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { MODULES, type ModuleKey } from "@/lib/admin/modules";
import type { AdminRole } from "@/lib/admin/adminRoles";

function ModuleCheckboxes({
  selected,
  onToggle,
}: {
  selected: ModuleKey[];
  onToggle: (key: ModuleKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {MODULES.map((m) => (
        <label
          key={m.key}
          className={`cursor-pointer rounded-full border px-3 py-1 font-body text-xs font-bold ${
            selected.includes(m.key)
              ? "border-brand-orange bg-brand-orange/10 text-brand-orange"
              : "border-brand-chocolate/20 text-brand-chocolate/70 hover:border-brand-chocolate/40"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(m.key)}
            onChange={() => onToggle(m.key)}
            className="sr-only"
          />
          {m.label}
        </label>
      ))}
    </div>
  );
}

function describeModules(role: AdminRole): string {
  if (role.name === "owner") return "Full access to every module";
  if (role.modules.length === 0) return "No modules";
  return role.modules.map((key) => MODULES.find((m) => m.key === key)?.label ?? key).join(", ");
}

export function RoleManager({ roles }: { roles: AdminRole[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [modules, setModules] = useState<ModuleKey[]>([]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editModules, setEditModules] = useState<ModuleKey[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [rowError, setRowError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const toggle = (key: ModuleKey) =>
    setModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));
  const toggleEdit = (key: ModuleKey) =>
    setEditModules((prev) => (prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]));

  const createRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, modules }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't create that role");
      setName("");
      setModules([]);
      router.refresh();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Couldn't create that role");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (role: AdminRole) => {
    setEditingId(role.id);
    setEditName(role.name);
    setEditModules(role.modules);
    setRowError(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSavingEdit(true);
    setRowError(null);
    const res = await fetch(`/api/admin/roles/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editName, modules: editModules }),
    });
    const data = await res.json().catch(() => ({}));
    setSavingEdit(false);
    if (!res.ok) {
      setRowError(data.error ?? "Couldn't save that role");
      return;
    }
    setEditingId(null);
    router.refresh();
  };

  const removeRole = async () => {
    if (!confirmingId) return;
    setRowError(null);
    const id = confirmingId;
    setConfirmingId(null);
    const res = await fetch(`/api/admin/roles/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRowError(data.error ?? "Couldn't delete that role");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="font-body text-sm text-brand-chocolate/60">
        Owner, Marketing, and Sales are built in. Marketing sees only Content &amp; Media, Sales
        sees everything except it, and Owner sees everything. Add a custom role below for anything
        in between.
      </p>

      {rowError && <p className="font-body text-sm text-red-600">{rowError}</p>}

      <div className="flex flex-col gap-3">
        {roles.map((role) => (
          <div key={role.id} className="rounded-2xl border-2 border-brand-chocolate/10 bg-white p-4">
            {editingId === role.id ? (
              <div className="flex flex-col gap-3">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="input-field w-full max-w-xs"
                />
                <ModuleCheckboxes selected={editModules} onToggle={toggleEdit} />
                <div className="flex gap-3">
                  <Button type="button" variant="primary" disabled={savingEdit} onClick={saveEdit}>
                    {savingEdit ? "Saving…" : "Save"}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-body text-sm font-bold capitalize text-brand-chocolate">
                    {role.name}
                    {role.isSystem && (
                      <span className="ml-2 rounded-full bg-brand-chocolate/10 px-2 py-0.5 font-body text-[10px] font-bold uppercase tracking-widest text-brand-chocolate/60">
                        Built-in
                      </span>
                    )}
                  </p>
                  <p className="mt-1 font-body text-xs text-brand-chocolate/60">{describeModules(role)}</p>
                </div>
                {!role.isSystem && (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => startEdit(role)}
                      className="font-body text-sm font-bold text-brand-orange hover:text-brand-chocolate"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(role.id)}
                      className="font-body text-sm font-bold text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <form
        onSubmit={createRole}
        className="flex flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6"
      >
        <p className="font-display text-lg font-semibold text-brand-chocolate">Create a custom role</p>
        <label className="block max-w-xs">
          <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Role name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Kitchen lead"
            className="input-field"
          />
        </label>
        <div>
          <span className="mb-2 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
            Modules
          </span>
          <ModuleCheckboxes selected={modules} onToggle={toggle} />
        </div>
        {createError && <p className="font-body text-sm text-red-600">{createError}</p>}
        <Button type="submit" variant="primary" disabled={creating} className="w-fit">
          {creating ? "Creating…" : "Create role"}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmingId !== null}
        message="Delete this role? You'll need to reassign any admin still using it first."
        onConfirm={removeRole}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
