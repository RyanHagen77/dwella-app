"use client";

import { useEffect, useState } from "react";
import { glass, ctaGhost, ctaPrimary, heading, textMeta } from "@/lib/glass";
import type { AdminUser, Role, UserKind } from "@/app/admin/page";

export function UserModal({
  open, onClose, value, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  value: AdminUser | null;
  onSubmit: (u: AdminUser) => void;
}) {
  const [form, setForm] = useState<AdminUser | null>(value);
  useEffect(() => setForm(value), [value, open]);

  if (!open || !form) return null;
  const isNew = !value?.name;

  function save() {
    if (!form.name.trim() || !form.email.trim()) return;
    onSubmit(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`${glass} relative z-10 w-full max-w-lg`}>
        <div className="flex items-start justify-between">
          <h2 className={`text-xl font-semibold ${heading}`}>{isNew ? "Create User" : "Edit User"}</h2>
          <button className={ctaGhost} onClick={onClose}>Close</button>
        </div>

        <div className="mt-3 space-y-3">
          <label className="block">
            <span className={`text-sm ${textMeta}`}>Name</span>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/60"
              placeholder="Full name or company"
            />
          </label>

          <label className="block">
            <span className={`text-sm ${textMeta}`}>Email</span>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/60"
              placeholder="name@example.com"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <label className="block">
              <span className={`text-sm ${textMeta}`}>Type</span>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value as UserKind })}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-sm text-white focus:ring-2 focus:ring-white/40"
              >
                {["homeowner","realtor","contractor","inspector","admin"].map(k => <option key={k} value={k}>{cap(k)}</option>)}
              </select>
            </label>

            <label className="block">
              <span className={`text-sm ${textMeta}`}>Role</span>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-sm text-white focus:ring-2 focus:ring-white/40"
              >
                {["superadmin","admin","support","read_only"].map(r => <option key={r} value={r}>{cap(r)}</option>)}
              </select>
            </label>

            <label className="block">
              <span className={`text-sm ${textMeta}`}>Status</span>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "suspended" })}
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-2 py-2 text-sm text-white focus:ring-2 focus:ring-white/40"
              >
                {["active","suspended"].map(s => <option key={s} value={s}>{cap(s)}</option>)}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={`text-sm ${textMeta}`}>Created</span>
              <input
                value={new Date(form.createdAt).toLocaleString()}
                disabled
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80"
              />
            </label>
            <label className="block">
              <span className={`text-sm ${textMeta}`}>Last Active</span>
              <input
                value={form.lastActive ? new Date(form.lastActive).toLocaleString() : "—"}
                disabled
                className="mt-1 w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/80"
              />
            </label>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
            <button className={ctaGhost} onClick={onClose}>Cancel</button>
            <button className={ctaPrimary} onClick={save}>{isNew ? "Create" : "Save"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).replace("_"," "); }
