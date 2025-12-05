"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

export type ReminderData = {
  id: string;
  title: string;
  dueAt: Date | string;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string | null;
    size: number | bigint | null;
  }>;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
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

export function EditReminderModal({
  open,
  onCloseAction,
  reminder,
  homeId,
}: Props) {
  const router = useRouter();
  const { push } = useToast();

  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: reminder.title,
    dueAt: new Date(reminder.dueAt).toISOString().slice(0, 10),
    note: reminder.note || "",
  });

  const existing = (reminder.attachments ?? []).filter(
    (att) => !deletedAttachmentIds.includes(att.id)
  );

  // Reset on open/reminder change
  useEffect(() => {
    if (!open) return;

    setForm({
      title: reminder.title,
      dueAt: new Date(reminder.dueAt).toISOString().slice(0, 10),
      note: reminder.note || "",
    });

    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setDeletedAttachmentIds([]);
    // eslint-disable-next-line
  }, [open, reminder.id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    previews.forEach((u) => URL.revokeObjectURL(u));

    const arr = Array.from(list);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  function removeExistingAttachment(id: string) {
    setDeletedAttachmentIds((prev) => [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return push("Title is required");
    if (!form.dueAt) return push("Due date is required");

    setSaving(true);
    try {
      // Update reminder
      const res = await fetch(
        `/api/home/${homeId}/reminders/${reminder.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title.trim(),
            dueAt: form.dueAt,
            note: form.note.trim() || null,
          }),
        }
      );

      if (!res.ok)
        throw new Error((await res.json().catch(() => ({}))).error || "Failed");

      // Delete attachments
      for (const id of deletedAttachmentIds) {
        await fetch(`/api/home/${homeId}/attachments/${id}`, {
          method: "DELETE",
        });
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

          const presigned = await presignRes.json();

          await fetch(presigned.url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });

          uploaded.push({
            storageKey: presigned.key,
            url: presigned.publicUrl || "",
            filename: file.name,
            contentType: file.type,
            size: file.size,
            visibility: "OWNER",
          });
        }

        await fetch(
          `/api/home/${homeId}/reminders/${reminder.id}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uploaded),
          }
        );
      }

      push("Reminder updated successfully", "success");
      onCloseAction();
      router.refresh();
    } catch (err) {
      push("Failed to update reminder");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative z-[100]">
      <Modal open={open} onCloseAction={onCloseAction} title="Edit Reminder">
        {/* Fix layout + mobile stability */}
        <div className="w-full max-w-[520px] mx-auto max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2 sm:px-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className={`text-sm ${textMeta}`}>Update reminder details.</p>

            {/* TITLE */}
            <label className="block">
              <span className={fieldLabel}>Title</span>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g., Replace HVAC filter"
                className="w-full"
                required
              />
            </label>

            {/* DATE — FIXED FULL WIDTH */}
            <label className="block">
              <span className={fieldLabel}>Due Date</span>
              <input
                type="date"
                value={form.dueAt}
                onChange={(e) => set("dueAt", e.target.value)}
                className="
                  w-full
                  rounded-lg
                  border border-white/20
                  bg-white/10
                  px-4 py-2
                  text-white
                  placeholder-white/50
                  focus:border-purple-400
                  focus:ring-2 focus:ring-purple-400/50
                  focus:outline-none
                  block
                  box-border
                "
                style={{ WebkitAppearance: "none" }}
                required
              />
            </label>

            {/* NOTES */}
            <label className="block">
              <span className={fieldLabel}>Notes</span>
              <Textarea
                rows={3}
                value={form.note}
                onChange={(e) => set("note", e.target.value)}
                className="w-full"
              />
            </label>

            {/* EXISTING ATTACHMENTS */}
            {existing.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-white/70">Existing attachments</div>

                <div className="space-y-1">
                  {existing.map((att) => {
                    const kb =
                      att.size == null
                        ? null
                        : (Number(att.size) / 1024).toFixed(1);

                    return (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                      >
                        <a
                          href={`/api/home/${homeId}/attachments/${att.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex flex-1 items-center gap-2 text-sm hover:text-white"
                        >
                          <span>📎</span>
                          <span className="flex-1 truncate max-w-[150px] sm:max-w-[250px]">
                            {att.filename}
                          </span>
                          {kb && (
                            <span className="text-xs text-white/50">
                              {kb} KB
                            </span>
                          )}
                        </a>

                        <button
                          type="button"
                          onClick={() => removeExistingAttachment(att.id)}
                          className="text-xs text-red-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NEW ATTACHMENTS */}
            <label className="block">
              <span className={fieldLabel}>Add Attachments</span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={(e) => onFiles(e.target.files)}
                className="mt-1 block w-full text-white file:border file:border-white/30 file:bg-white/10 file:px-3 file:py-1.5 file:rounded-md hover:file:bg-white/20"
              />
            </label>

            {/* PREVIEWS */}
            {previews.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-white/70">New attachments</div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {previews.map((url, i) => (
                    <div key={url} className="relative flex-shrink-0">
                      <Image
                        src={url}
                        alt={`Preview ${i + 1}`}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded border border-white/20 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton type="button" onClick={onCloseAction} disabled={saving}>
                Cancel
              </GhostButton>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}