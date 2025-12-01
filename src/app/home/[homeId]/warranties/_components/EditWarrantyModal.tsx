// app/stats/[homeId]/warranties/_components/EditWarrantyModal.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

type WarrantyData = {
  id: string;
  item: string;
  provider: string | null;
  policyNo: string | null;
  expiresAt: Date | string | null;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string | null;
    size: number | bigint | null; // allow bigint from Prisma
  }>;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
  warranty: WarrantyData;
  homeId: string;
};

export function EditWarrantyModal({ open, onCloseAction, warranty, homeId }: Props) {
  const router = useRouter();
  const { push } = useToast();

  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Form state
  const [form, setForm] = useState({
    item: warranty.item,
    provider: warranty.provider || "",
    policyNo: warranty.policyNo || "",
    expiresAt: warranty.expiresAt
      ? new Date(warranty.expiresAt).toISOString().slice(0, 10)
      : "",
    note: warranty.note || "",
  });

  // Reset when modal opens or warranty changes
  useEffect(() => {
    if (!open) return;

    setForm({
      item: warranty.item,
      provider: warranty.provider || "",
      policyNo: warranty.policyNo || "",
      expiresAt: warranty.expiresAt
        ? new Date(warranty.expiresAt).toISOString().slice(0, 10)
        : "",
      note: warranty.note || "",
    });

    // Clear pending uploads + revoke previews
    setFiles([]);
    setPreviews((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, warranty.id]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);

    // revoke old previews
    previews.forEach((url) => URL.revokeObjectURL(url));

    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
    setPreviews((p) => {
      const url = p[index];
      if (url) URL.revokeObjectURL(url);
      return p.filter((_, i) => i !== index);
    });
    setFiles((f) => f.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.item.trim()) {
      push("Item name is required");
      return;
    }

    setSaving(true);

    try {
      // 1) Update warranty fields
      const res = await fetch(
        `/api/home/${homeId}/warranties/${warranty.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            item: form.item.trim(),
            provider: form.provider.trim() || null,
            policyNo: form.policyNo.trim() || null,
            expiresAt: form.expiresAt || null, // YYYY-MM-DD or null
            note: form.note.trim() || null,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update warranty");
      }

      // 2) Upload files (if any)
      if (files.length > 0) {
        const uploadedAttachments: Array<{
          storageKey: string;
          url: string;
          filename: string;
          contentType: string;
          size: number;
          visibility: "OWNER";
          notes?: string;
        }> = [];

        for (const file of files) {
          // a) presign
          const presignRes = await fetch("/api/uploads/presign", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              homeId,
              warrantyId: warranty.id,
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              size: file.size,
            }),
          });

          if (!presignRes.ok) {
            const errorText = await presignRes.text();
            throw new Error(
              `Failed to get upload URL for ${file.name}: ${errorText}`
            );
          }

          const { key, url, publicUrl } = await presignRes.json();

          // b) upload to s3
          const uploadRes = await fetch(url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
          });

          if (!uploadRes.ok) {
            const err = await uploadRes.text();
            throw new Error(
              `Failed to upload ${file.name}: ${uploadRes.status} ${err}`
            );
          }

          uploadedAttachments.push({
            storageKey: key,
            url: publicUrl || "",
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            visibility: "OWNER",
          });
        }

        // c) save metadata
        const attachmentRes = await fetch(
          `/api/home/${homeId}/warranties/${warranty.id}/attachments`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(uploadedAttachments),
          }
        );

        if (!attachmentRes.ok) {
          throw new Error("Failed to save attachments");
        }
      }

      push("Warranty updated successfully");
      onCloseAction();
      router.refresh();
    } catch (error) {
      console.error("Failed to update warranty:", error);
      push(error instanceof Error ? error.message : "Failed to update warranty");
    } finally {
      setSaving(false);
    }
  }

  const existingAttachments = warranty.attachments ?? [];

  return (
    <div className="relative z-[100]">
      <Modal open={open} onCloseAction={onCloseAction} title="Edit Warranty">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Header helper text (matches AddRecordModal vibe) */}
          <p className={`text-sm ${textMeta}`}>
            Update warranty details and optionally add new documents or photos.
          </p>

          <label className="block">
            <span className={fieldLabel}>Item</span>
            <Input
              value={form.item}
              onChange={(e) => set("item", e.target.value)}
              placeholder="e.g., HVAC System"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className={fieldLabel}>Provider</span>
              <Input
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="e.g., Carrier"
              />
            </label>
            <label className="block">
              <span className={fieldLabel}>Policy Number</span>
              <Input
                value={form.policyNo}
                onChange={(e) => set("policyNo", e.target.value)}
                placeholder="e.g., WAR-12345"
              />
            </label>
          </div>

          <label className="block">
            <span className={fieldLabel}>Expiration Date (optional)</span>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Notes (optional)</span>
            <Textarea
              rows={4}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Coverage details, serial numbers, etc."
            />
          </label>

          {/* Upload */}
          <label className="block">
            <span className={fieldLabel}>Add Attachments (optional)</span>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => onFiles(e.target.files)}
              className="mt-1 block w-full text-white/85 file:mr-3 file:rounded-md file:border file:border-white/30 file:bg-white/10 file:px-3 file:py-1.5 file:text-white hover:file:bg-white/15"
            />
            <p className={`mt-1 text-xs ${textMeta}`}>
              Photos, manuals, invoices, or PDFs.
            </p>
          </label>

          {/* Existing attachments */}
          {existingAttachments.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-white/70">
                Existing Attachments:
              </div>
              <div className="space-y-1">
                {existingAttachments.map((att) => {
                  const sizeKb =
                    att.size == null ? null : Number(att.size) / 1024;

                  return (
                    <a
                      key={att.id}
                      href={`/api/home/${homeId}/attachments/${att.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:bg-white/10"
                    >
                      <span>📎</span>
                      <span className="flex-1 truncate">{att.filename}</span>
                      {sizeKb != null && (
                        <span className="text-xs text-white/50">
                          {sizeKb.toFixed(1)} KB
                        </span>
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
              <div className="text-sm text-white/70">
                New Attachments:
              </div>
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
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onCloseAction} disabled={saving}>
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