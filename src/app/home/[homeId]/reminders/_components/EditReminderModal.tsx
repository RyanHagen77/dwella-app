"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

import {
  formFieldShell,
  formInputInner,
  formTextareaInner,
  formLabelCaps,
  formHelperText,
  formSectionSurface,
  formQuietButton,
} from "@/components/ui/formFields";

export type ReminderData = {
  id: string;
  title: string;
  dueAt: Date | string;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string | null; // ✅ allow null (matches list + prevents TS mismatch)
    mimeType: string | null;
    size: number | bigint | null;
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  reminder: ReminderData;
  homeId: string;
};

type UploadedAttachment = {
  storageKey: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  visibility: "OWNER";
  notes?: string;
};

function toISODateInput(value: Date | string) {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function EditReminderModal({ open, onClose, reminder, homeId }: Props) {
  const router = useRouter();
  const { push } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);

  const [form, setForm] = useState(() => ({
    title: reminder.title,
    dueAt: toISODateInput(reminder.dueAt),
    note: reminder.note || "",
  }));

  const existing = useMemo(
    () => (reminder.attachments ?? []).filter((att) => !deletedAttachmentIds.includes(att.id)),
    [reminder.attachments, deletedAttachmentIds]
  );

  // Reset on open/reminder change
  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setForm({
      title: reminder.title,
      dueAt: toISODateInput(reminder.dueAt),
      note: reminder.note || "",
    });

    // clear new files + previews
    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setDeletedAttachmentIds([]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reminder.id]);

  // Revoke previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;

    // revoke old previews
    previews.forEach((u) => URL.revokeObjectURL(u));

    const arr = Array.from(list);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  // ✅ Fixed: uses functional updates (no stale state), clears input when last file removed
  function removeFile(index: number) {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0 && fileInputRef.current) fileInputRef.current.value = "";
      return next;
    });

    setPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeExistingAttachment(id: string) {
    setDeletedAttachmentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError("Title is required.");
      return;
    }
    if (!form.dueAt) {
      setFormError("Due date is required.");
      return;
    }

    setSaving(true);
    try {
      // Update reminder
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          dueAt: form.dueAt,
          note: form.note.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update reminder");
      }

      // Delete attachments
      for (const id of deletedAttachmentIds) {
        const del = await fetch(`/api/home/${homeId}/attachments/${id}`, { method: "DELETE" });
        if (!del.ok) {
          // non-fatal but visible
          push("Some attachments could not be removed.");
        }
      }

      // Upload new files
      if (files.length > 0) {
        const uploaded: UploadedAttachment[] = [];

        for (const file of files) {
          const presignRes = await fetch("/api/uploads/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              homeId,
              reminderId: reminder.id,
              filename: file.name,
              contentType: file.type,
              size: file.size,
            }),
          });

          if (!presignRes.ok) {
            const data = await presignRes.json().catch(() => null);
            throw new Error(data?.error || "Failed to start upload");
          }

          const presigned = await presignRes.json();

          const putRes = await fetch(presigned.url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          if (!putRes.ok) throw new Error("Upload failed");

          uploaded.push({
            storageKey: presigned.key,
            url: presigned.publicUrl || "",
            filename: file.name,
            contentType: file.type,
            size: file.size,
            visibility: "OWNER",
          });
        }

        const attachRes = await fetch(`/api/home/${homeId}/reminders/${reminder.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploaded),
        });

        if (!attachRes.ok) {
          const data = await attachRes.json().catch(() => null);
          throw new Error(data?.error || "Failed to save attachments");
        }
      }

      push("Reminder updated successfully", "success");
      onClose();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update reminder.";
      setFormError(msg);
      push("Failed to update reminder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={onClose} title="Edit Reminder">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className={`text-sm ${textMeta}`}>Update reminder details.</p>

        {formError ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">
            {formError}
          </div>
        ) : null}

        {/* Title */}
        <label className="block">
          <span className={formLabelCaps}>
            Title <span className="text-white/60">*</span>
          </span>
          <div className={formFieldShell}>
            <input
              className={formInputInner}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., Replace HVAC filter"
              required
            />
          </div>
        </label>

        {/* Due date */}
        <label className="block">
          <span className={formLabelCaps}>
            Due Date <span className="text-white/60">*</span>
          </span>
          <div className={`${formFieldShell} relative`}>
            <input
              type="date"
              className={formInputInner}
              value={form.dueAt}
              onChange={(e) => set("dueAt", e.target.value)}
              required
            />
          </div>
          <div className={formHelperText}>Pick the date you want to be reminded.</div>
        </label>

        {/* Notes */}
        <label className="block">
          <span className={formLabelCaps}>Notes</span>
          <div className={formFieldShell}>
            <textarea
              rows={4}
              className={formTextareaInner}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Optional details…"
            />
          </div>
        </label>

        {/* Existing attachments */}
        {existing.length > 0 ? (
          <div className="space-y-2">
            <div className={formLabelCaps}>Existing attachments</div>

            <div className="space-y-2">
              {existing.map((att) => {
                const kb = att.size == null ? null : (Number(att.size) / 1024).toFixed(1);

                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <a
                      href={`/api/home/${homeId}/attachments/${att.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1"
                    >
                      <div className="truncate text-sm font-medium text-white">{att.filename}</div>
                      <div className="mt-0.5 text-xs text-white/60">
                        {att.mimeType ?? "Attachment"}
                        {kb ? ` • ${kb} KB` : ""}
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(att.id)}
                      disabled={saving}
                      className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-400/15 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* New attachments */}
        <div className="space-y-2">
          <div className={formLabelCaps}>Add attachments</div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => onFiles(e.target.files)}
            className="sr-only"
          />

          <button
            type="button"
            className={formQuietButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            + Choose files
          </button>

          {previews.length > 0 ? (
            <div className={formSectionSurface}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                New attachments ({previews.length})
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((url, i) => (
                  <div key={url} className="relative flex-shrink-0">
                    <Image
                      src={url}
                      alt={`Preview ${i + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={saving}
                      className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-60"
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <GhostButton type="button" onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}