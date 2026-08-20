"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminUser } from "@/lib/admin/auth";

const EMPTY = { email: "", displayName: "", role: "staff" as "owner" | "staff", password: "" };

export function AdminAccountsManager({
  accounts,
  currentAdminId,
}: {
  accounts: AdminUser[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  const addAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't create that account");
      setDraft(EMPTY);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that account");
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (id: string, role: "owner" | "staff") => {
    setRowError(null);
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRowError(data.error ?? "Couldn't change that role");
      return;
    }
    router.refresh();
  };

  const removeAccount = async () => {
    if (!confirmingId) return;
    setRowError(null);
    const id = confirmingId;
    setConfirmingId(null);
    const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setRowError(data.error ?? "Couldn't remove that account");
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      {rowError && <p className="font-body text-sm text-red-600">{rowError}</p>}

      <div className="overflow-x-auto rounded-2xl border-2 border-brand-chocolate/10 bg-white">
        <table className="w-full font-body text-sm">
          <thead>
            <tr className="border-b border-brand-chocolate/10 text-left text-xs uppercase tracking-widest text-brand-chocolate/50">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-b border-brand-chocolate/5 last:border-0">
                <td className="p-3 font-bold text-brand-chocolate">
                  {account.displayName}
                  {account.id === currentAdminId && (
                    <span className="ml-2 rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-brand-chocolate">
                      You
                    </span>
                  )}
                </td>
                <td className="p-3 text-brand-chocolate/70">{account.email}</td>
                <td className="p-3">
                  <select
                    value={account.role}
                    onChange={(e) => changeRole(account.id, e.target.value as "owner" | "staff")}
                    className="input-field text-xs"
                  >
                    <option value="owner">Owner</option>
                    <option value="staff">Staff</option>
                  </select>
                </td>
                <td className="p-3 text-right">
                  {account.id !== currentAdminId && (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(account.id)}
                      className="font-body text-sm font-bold text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={addAccount} className="flex flex-col gap-4 rounded-3xl border-2 border-brand-chocolate/10 bg-white p-6">
        <p className="font-display text-lg font-semibold text-brand-chocolate">Add an admin</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              Name
            </span>
            <input
              required
              value={draft.displayName}
              onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              Email
            </span>
            <input
              required
              type="email"
              value={draft.email}
              onChange={(e) => setDraft({ ...draft, email: e.target.value })}
              className="input-field"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              Initial password
            </span>
            <input
              required
              minLength={6}
              type="text"
              value={draft.password}
              onChange={(e) => setDraft({ ...draft, password: e.target.value })}
              className="input-field"
              placeholder="Share this with them directly"
            />
          </label>
          <label className="block">
            <span className="mb-1 block font-body text-xs font-bold uppercase tracking-widest text-brand-chocolate/60">
              Role
            </span>
            <select
              value={draft.role}
              onChange={(e) => setDraft({ ...draft, role: e.target.value as "owner" | "staff" })}
              className="input-field"
            >
              <option value="staff">Staff</option>
              <option value="owner">Owner</option>
            </select>
          </label>
        </div>
        {error && <p className="font-body text-sm text-red-600">{error}</p>}
        <Button type="submit" variant="primary" disabled={saving} className="w-fit">
          {saving ? "Adding…" : "Add admin"}
        </Button>
      </form>

      <ConfirmDialog
        open={confirmingId !== null}
        message="Remove this admin's access to the portal? Their login stays intact, but they won't be able to sign in here anymore."
        onConfirm={removeAccount}
        onCancel={() => setConfirmingId(null)}
      />
    </div>
  );
}
