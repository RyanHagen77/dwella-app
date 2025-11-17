// app/pro/contractor/work-records/[id]/EditWorkRecordModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";

type WorkRecordData = {
  id: string;
  workType: string;
  workDate: string;
  description: string;
  cost: number | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  workRecord: WorkRecordData;
  workRecordId: string;
};

export function EditWorkRecordModal({ open, onClose, workRecord, workRecordId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Initialize form with current work record data
  const [form, setForm] = useState({
    workType: workRecord.workType,
    workDate: workRecord.workDate,
    description: workRecord.description || "",
    cost: workRecord.cost || 0,
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [warrantyFile, setWarrantyFile] = useState<File | null>(null);

  // Reset form when work record changes or modal opens
  useState(() => {
    if (open) {
      setForm({
        workType: workRecord.workType,
        workDate: workRecord.workDate,
        description: workRecord.description || "",
        cost: workRecord.cost || 0,
      });
      setPhotoFiles([]);
      setInvoiceFile(null);
      setWarrantyFile(null);
    }
  });

  function set<K extends keyof typeof form>(k: K, v: typeof form[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadFileWithRecordId(file: File, recordId: string): Promise<string> {
    // Get presigned URL
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeId: workRecord.id, // You'll need to pass homeId from parent
        recordId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { url: uploadUrl, publicUrl } = await presignResponse.json();

    // Upload to S3
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to S3");
    }

    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.workType.trim()) {
      alert("Work type is required");
      return;
    }

    setSaving(true);

    try {
      // Step 1: Update work record details
      const res = await fetch(`/api/pro/contractor/work-records/${workRecordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workType: form.workType,
          workDate: form.workDate,
          description: form.description || null,
          cost: form.cost || null,
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update work record");
      }

      // Step 2: Upload new files if any
      if (photoFiles.length > 0 || invoiceFile || warrantyFile) {
        setUploading(true);

        const photoUrls: string[] = [];
        for (const file of photoFiles) {
          const url = await uploadFileWithRecordId(file, workRecordId);
          photoUrls.push(url);
        }

        const invoiceUrl = invoiceFile
          ? await uploadFileWithRecordId(invoiceFile, workRecordId)
          : null;

        const warrantyUrl = warrantyFile
          ? await uploadFileWithRecordId(warrantyFile, workRecordId)
          : null;

        // Step 3: Update work record with file URLs
        await fetch(`/api/pro/contractor/work-records/${workRecordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photos: photoUrls,
            invoice: invoiceUrl,
            warranty: warrantyUrl,
          }),
        });

        setUploading(false);
      }

      alert("Work record updated successfully");
      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to update work record:", error);
      alert(error instanceof Error ? error.message : "Failed to update work record");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setPhotoFiles(Array.from(e.target.files));
    }
  }

  function handleInvoiceChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setInvoiceFile(e.target.files[0]);
    }
  }

  function handleWarrantyChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) {
      setWarrantyFile(e.target.files[0]);
    }
  }

  return (
    <Modal open={open} onCloseAction={onClose} title="Edit Work Record">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={fieldLabel}>Work Type</span>
          <Input
            value={form.workType}
            onChange={(e) => set("workType", e.target.value)}
            placeholder="e.g., HVAC Repair"
            required
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>Work Date</span>
          <Input
            type="date"
            value={form.workDate}
            onChange={(e) => set("workDate", e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>Cost</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(e) => set("cost", Number(e.target.value))}
            placeholder="0.00"
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>Description</span>
          <Textarea
            rows={4}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder="Describe the work performed..."
          />
        </label>

        {/* Photo Upload */}
        <label className="block">
          <span className={fieldLabel}>Add Photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none backdrop-blur file:mr-4 file:rounded file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/30"
          />
          {photoFiles.length > 0 && (
            <p className="mt-1 text-xs text-white/60">
              {photoFiles.length} photo{photoFiles.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </label>

        {/* Invoice Upload */}
        <label className="block">
          <span className={fieldLabel}>Add Invoice (PDF)</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleInvoiceChange}
            className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none backdrop-blur file:mr-4 file:rounded file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/30"
          />
          {invoiceFile && (
            <p className="mt-1 text-xs text-white/60">{invoiceFile.name}</p>
          )}
        </label>

        {/* Warranty Upload */}
        <label className="block">
          <span className={fieldLabel}>Add Warranty (PDF)</span>
          <input
            type="file"
            accept=".pdf"
            onChange={handleWarrantyChange}
            className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none backdrop-blur file:mr-4 file:rounded file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/30"
          />
          {warrantyFile && (
            <p className="mt-1 text-xs text-white/60">{warrantyFile.name}</p>
          )}
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={onClose} disabled={saving || uploading}>
            Cancel
          </GhostButton>
          <Button type="submit" disabled={saving || uploading}>
            {uploading ? "Uploading files..." : saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}