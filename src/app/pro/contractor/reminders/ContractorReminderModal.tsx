// app/pro/contractor/reminders/ContractorReminderModal.tsx
"use client";

import { useEffect, useState } from "react";
import { ctaPrimary, ctaGhost, textMeta } from "@/lib/glass";
import type { ContractorReminderDTO } from "./ContractorRemindersClient";

type Props = {
  reminder: ContractorReminderDTO | null;
  onClose: () => void;
  onSaved: (reminder: ContractorReminderDTO) => void;
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ContractorReminderModal({
  reminder,
  onClose,
  onSaved,
}: Props) {
  const isEdit = !!reminder;

  const [title, setTitle] = useState(reminder?.title ?? "");
  const [date, setDate] = useState(toDateInputValue(reminder?.dueAt ?? null));
  const [note, setNote] = useState(reminder?.note ?? "");
  const [status, setStatus] = useState<"PENDING" | "DONE">(
    reminder?.status ?? "PENDING"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!date) {
      setError("Due date is required.");
      return;
    }

    setSaving(true);
    try {
      const body: any = {
        title: title.trim(),
        dueAt: new Date(date + "T12:00:00").toISOString(), // midday to avoid TZ edge cases
        note: note.trim() || null,
        status,
      };

      const res = await fetch(
        isEdit
          ? `/api/pro/contractor/reminders/${reminder!.id}`
          : "/api/pro/contractor/reminders",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error || "Failed to save reminder.");
        setSaving(false);
        return;
      }

      const json = await res.json();
      const saved = json.reminder;

      const dto: ContractorReminderDTO = {
        id: saved.id,
        title: saved.title,
        note: saved.note,
        status: saved.status,
        dueAt: saved.dueAt,
        createdAt: saved.createdAt,
      };

      onSaved(dto);
    } catch {
      setError("Something went wrong while saving.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3">
      <div
        className="w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/10 bg-[#05050a]/95 shadow-xl backdrop-blur"
        role="dialog"
        aria-modal="true"
      >
        <form
          onSubmit={handleSubmit}
          className="max-h-[calc(100vh-5rem)] overflow-x-hidden overflow-y-auto px-3 pb-4 pt-2 sm:px-5 sm:pt-4"
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {isEdit ? "Edit Reminder" : "New Reminder"}
              </h2>
              <p className={textMeta + " mt-0.5 text-xs"}>
                These are private to your contractor account.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/5 hover:text-white"
            >
              Close
            </button>
          </div>

          {/* Fields */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-white/80">
                Title <span className="text-red-400">*</span>
              </label>
              <input
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Follow up with client about maintenance plan"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/80">
                Due date <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-0 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                style={{
                  WebkitAppearance: "none",
                  MozAppearance: "textfield",
                }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/80">
                Notes
              </label>
              <textarea
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-0 placeholder:text-white/30 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Optional context about the job, client, or follow-up steps."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-white/80">
                Status
              </label>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 ${
                    status === "PENDING"
                      ? "bg-white/10 text-white"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setStatus("PENDING")}
                >
                  Pending
                </button>
                <button
                  type="button"
                  className={`rounded-full px-3 py-1.5 ${
                    status === "DONE"
                      ? "bg-emerald-500/20 text-emerald-100"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                  onClick={() => setStatus("DONE")}
                >
                  Completed
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-end gap-2">
            <button
              type="button"
              className={ctaGhost + " px-3 py-1.5 text-xs"}
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={ctaPrimary + " px-4 py-1.5 text-xs"}
              disabled={saving}
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}