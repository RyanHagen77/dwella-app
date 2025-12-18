"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useSession } from "next-auth/react";

type RecordData = {
  id: string;
  title: string;
  date: Date | null;
  kind: string | null;
  vendor: string | null;
  cost: number | null;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string | null;
    size: number | bigint | null;
    uploadedBy: string;
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  record: RecordData;
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

export function EditRecordModal({ open, onClose, record, homeId }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: record.title,
    date: record.date ? new Date(record.date).toISOString().slice(0, 10) : "",
    category: record.kind || "Maintenance",
    vendor: record.vendor || "",
    cost: record.cost ?? 0,
    note: record.note || "",
  });

  // Only attachments from the current user, excluding ones flagged for deletion
  const existing = (record.attachments ?? []).filter(
    (att) =>
      !deletedAttachmentIds.includes(att.id) &&
      att.uploadedBy === session?.user?.id
  );

  // Contractor attachments (read-only)
  const contractorAttachments = (record.attachments ?? []).filter(
    (att) => att.uploadedBy !== session?.user?.id
  );

  useEffect(() => {
    if (!open) return;

    setForm({
      title: record.title,
      date: record.date ? new Date(record.date).toISOString().slice(0, 10) : "",
      category: record.kind || "Maintenance",
      vendor: record.vendor || "",
      cost: record.cost ?? 0,
      note: record.note || "",
    });

    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setDeletedAttachmentIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, record.id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
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
    if (!form.title.trim()) {
      push("Title is required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/home/${homeId}/records/${record.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          date: form.date || undefined,
          kind: form.category?.toLowerCase(),
          vendor: form.vendor || null,
          cost: form.cost || null,
          note: form.note || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(data.error || "Failed");
      }

      // Delete any attachments the user removed
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
              recordId: record.id,
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              size: file.size,
            }),
          });

          if (!presignRes.ok) {
            const t = await presignRes.text();
            throw new Error(`Failed to get upload URL: ${t}`);
          }

          const presigned = await presignRes.json();

          const uploadRes = await fetch(presigned.url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
          });

          if (!uploadRes.ok) {
            const t = await uploadRes.text();
            throw new Error(`Failed to upload ${file.name}: ${t}`);
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

        await fetch(`/api/home/${homeId}/records/${record.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploaded),
        });
      }

      push("Record updated successfully", "success");
      onClose();
      router.refresh();
    } catch (err) {
      console.error(err);
      push("Failed to update record");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Record">
      <div className="w-full max-w-[520px] mx-auto max-h-[calc(100vh-5rem)] overflow-y-auto overflow-x-hidden px-3 pb-4 pt-2 sm:px-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <label className="block">
            <span className={fieldLabel}>Title</span>
            <Input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g., HVAC Tune-up"
              required
              className="w-full"
            />
          </label>

          {/* Date + Category */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={fieldLabel}>Date</span>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set("date", e.target.value)}
                className="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white placeholder-white/50 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50"
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: "0",
                  boxSizing: "border-box",
                  WebkitAppearance: "none",
                  MozAppearance: "textfield",
                }}
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>Category</span>
              <Select
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full"
              >
                <option>Maintenance</option>
                <option>Repair</option>
                <option>Upgrade</option>
                <option>Inspection</option>
              </Select>
            </label>
          </div>

          {/* Vendor + Cost */}
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={fieldLabel}>Vendor</span>
              <Input
                value={form.vendor}
                onChange={(e) => set("vendor", e.target.value)}
                placeholder="e.g., ChillRight Heating"
                className="w-full"
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>Cost</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.cost}
                onChange={(e) =>
                  set("cost", e.target.value ? Number(e.target.value) : 0)
                }
                className="w-full"
              />
            </label>
          </div>

          {/* Notes */}
          <label className="block">
            <span className={fieldLabel}>Notes</span>
            <Textarea
              rows={4}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Optional details…"
              className="w-full"
            />
          </label>

          {/* Contractor attachments (read-only) */}
          {contractorAttachments.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-white/70">
                Contractor attachments
              </div>
              <div className="space-y-1">
                {contractorAttachments.map((att) => {
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
                        <span className="flex-1 truncate max-w-[200px] sm:max-w-[300px]">
                          {att.filename}
                        </span>
                        {kb && (
                          <span className="text-xs text-white/50">
                            {kb} KB
                          </span>
                        )}
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Your attachments (deletable) */}
          {existing.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-white/70">Your attachments</div>
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

          {/* New attachments input */}
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

          {/* New previews */}
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

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onClose} disabled={saving}>
              Cancel
            </GhostButton>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}