"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

type ReminderData = {
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

  const [form, setForm] = useState({
    title: reminder.title,
    dueAt: new Date(reminder.dueAt).toISOString().slice(0, 10),
    note: reminder.note || "",
  });

  // Reset when modal opens / reminder changes
  useEffect(() => {
    if (!open) return;

    setForm({
      title: reminder.title,
      dueAt: new Date(reminder.dueAt).toISOString().slice(0, 10),
      note: reminder.note || "",
    });

    // Clear files + revoke previews
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]);
    setPreviews([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reminder.id]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;

    // revoke old previews
    previews.forEach((url) => URL.revokeObjectURL(url));

    const arr = Array.from(list);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      push("Title is required");
      return;
    }

    if (!form.dueAt) {
      push("Due date is required");
      return;
    }

    setSaving(true);

    try {
      // 1) Update reminder
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

      if (!res.ok) {
        const error = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(error.error || "Failed to update reminder");
      }

      // 2) Upload files if any
      if (files.length > 0) {
        const uploaded: UploadedAttachment[] = [];

        for (const file of files) {
          // presign
          const presignRes = await fetch("/api/uploads/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              homeId,
              reminderId: reminder.id,
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              size: file.size,
            }),
          });

          if (!presignRes.ok) {
            const msg = await presignRes.text();
            throw new Error(`Failed to get upload URL: ${msg}`);
          }

          const presigned = (await presignRes.json()) as {
            key: string;
            url: string;
            publicUrl?: string;
          };

          // upload to S3
          const uploadRes = await fetch(presigned.url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.text();
            throw new Error(`Failed to upload ${file.name}: ${err}`);
          }

          uploaded.push({
            storageKey: presigned.key,
            url: presigned.publicUrl || "",
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            visibility: "OWNER",
          });
        }

        // save metadata
        const saveRes = await fetch(
          `/api/home/${homeId}/reminders/${reminder.id}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uploaded),
          }
        );

        if (!saveRes.ok) {
          throw new Error("Failed to save attachments");
        }
      }

      push("Reminder updated successfully");
      onCloseAction();
      router.refresh();
    } catch (error) {
      console.error("Failed to update reminder:", error);
      push(error instanceof Error ? error.message : "Failed to update reminder");
    } finally {
      setSaving(false);
    }
  }

  const existing = reminder.attachments ?? [];

  return (
    <div className="relative z-[100]">
      <Modal open={open} onCloseAction={onCloseAction} title="Edit Reminder">
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className={`text-sm ${textMeta}`}>
            Update reminder details and optionally upload new files.
          </p>

          <label className="block">
            <span className={fieldLabel}>Title</span>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., Replace HVAC filter"
              required
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Due Date</span>
            <Input
              type="date"
              value={form.dueAt}
              onChange={(e) => set("dueAt", e.target.value)}
              required
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Notes (optional)</span>
            <Textarea
              rows={3}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Additional details…"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Add Attachments (optional)</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => onFiles(e.target.files)}
              className="mt-1 block w-full text-white/85 file:mr-3 file:rounded-md file:border file:border-white/30 file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/15"
            />
          </label>

          {/* Existing attachments */}
          {existing.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-white/70">Existing Attachments:</div>
              <div className="space-y-1">
                {existing.map((att) => {
                  const kb =
                    att.size == null
                      ? null
                      : (Number(att.size) / 1024).toFixed(1);

                  return (
                    <a
                      key={att.id}
                      href={`/api/home/${homeId}/attachments/${att.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                    >
                      <span>📎</span>
                      <span className="flex-1 truncate">{att.filename}</span>
                      {kb && (
                        <span className="text-xs text-white/50">{kb} KB</span>
                      )}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {/* New previews */}
          {previews.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-white/70">New Attachments:</div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {previews.map((u, i) => (
                  <div key={u} className="relative flex-shrink-0">
                    <Image
                      src={u}
                      alt={`Preview ${i + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded border border-white/20 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-xs text-white hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <GhostButton
              type="button"
              onClick={onCloseAction}
              disabled={saving}
            >
              Cancel
            </GhostButton>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}