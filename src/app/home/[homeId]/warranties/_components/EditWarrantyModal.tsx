"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

type WarrantyData = {
  id: string;
  item: string;
  provider: string | null;
  policyNo: string | null;
  expiresAt: Date | null;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  warranty: WarrantyData;
  homeId: string;
};

export function EditWarrantyModal({ open, onClose, warranty, homeId }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  // Initialize form with current warranty data
  const [form, setForm] = useState({
    item: warranty.item,
    provider: warranty.provider || "",
    policyNo: warranty.policyNo || "",
    expiresAt: warranty.expiresAt ? new Date(warranty.expiresAt).toISOString().slice(0, 10) : "",
    note: warranty.note || "",
  });

  // Reset form when warranty changes or modal opens
  useState(() => {
    if (open) {
      setForm({
        item: warranty.item,
        provider: warranty.provider || "",
        policyNo: warranty.policyNo || "",
        expiresAt: warranty.expiresAt ? new Date(warranty.expiresAt).toISOString().slice(0, 10) : "",
        note: warranty.note || "",
      });
      // Clear files
      setFiles([]);
      previews.forEach(url => URL.revokeObjectURL(url));
      setPreviews([]);
    }
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;
    const arr = Array.from(list);
    setFiles(arr);
    const newPreviews = arr.map(f => URL.createObjectURL(f));
    setPreviews(newPreviews);
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles(f => f.filter((_, i) => i !== index));
    setPreviews(p => p.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.item.trim()) {
      push("Item name is required");
      return;
    }

    setSaving(true);

    try {
      // First update the warranty
      const res = await fetch(`/api/home/${homeId}/warranties/${warranty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: form.item,
          provider: form.provider || null,
          policyNo: form.policyNo || null,
          expiresAt: form.expiresAt || null, // Send as YYYY-MM-DD string or null
          note: form.note || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update warranty");
      }

      // Then upload files if any
      if (files.length > 0) {
        const uploadedAttachments = [];

        // Process each file
        for (const file of files) {
          try {
            // 1. Get presigned URL for this file
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
              console.error("Presign failed:", errorText);
              throw new Error(`Failed to get upload URL for ${file.name}: ${errorText}`);
            }

            const { key, url, publicUrl } = await presignRes.json();
            console.log("Presign successful:", { key, filename: file.name });

            // 2. Upload file to S3
            const uploadRes = await fetch(url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type || "application/octet-stream",
              },
            });

            if (!uploadRes.ok) {
              const errorText = await uploadRes.text();
              console.error("S3 upload failed:", errorText);
              throw new Error(`Failed to upload ${file.name}: ${uploadRes.status} ${errorText}`);
            }

            console.log("S3 upload successful:", file.name);

            // Track for metadata save
            uploadedAttachments.push({
              storageKey: key,
              url: publicUrl || "",
              filename: file.name,
              contentType: file.type || "application/octet-stream",
              size: file.size,
              visibility: "OWNER",
              notes: undefined,
            });
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            throw error;
          }
        }

        // 3. Save all attachment metadata
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
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to update warranty:", error);
      push(error instanceof Error ? error.message : "Failed to update warranty");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={onClose} title="Edit Warranty">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        {warranty.attachments && warranty.attachments.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-white/70">Existing Attachments:</div>
            <div className="space-y-1">
              {warranty.attachments.map((att) => (
                <a
                  key={att.id}
                  href={`/api/home/${homeId}/attachments/${att.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-sm"
                >
                  <span>📎</span>
                  <span className="flex-1 truncate">{att.filename}</span>
                  <span className="text-xs text-white/50">
                    {(att.size / 1024).toFixed(1)} KB
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* New file previews */}
        {previews.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm text-white/70">New Attachments:</div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previews.map((u, i) => (
                <div key={i} className="relative flex-shrink-0">
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
          <GhostButton type="button" onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}