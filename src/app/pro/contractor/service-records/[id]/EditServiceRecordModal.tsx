"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";

type ServiceRecordData = {
  id: string;
  serviceType: string;
  serviceDate: string;
  description: string;
  cost: number | null;
};

type Props = {
  open: boolean;
  onCloseAction: () => void;
  serviceRecord: ServiceRecordData;
  serviceRecordId: string;
};

export function EditServiceRecordModal({
  open,
  onCloseAction,
  serviceRecord,
  serviceRecordId,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    serviceType: serviceRecord.serviceType,
    serviceDate: serviceRecord.serviceDate,
    description: serviceRecord.description || "",
    cost: serviceRecord.cost || 0,
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [warrantyFile, setWarrantyFile] = useState<File | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadFileWithRecordId(
    file: File,
    recordId: string
  ): Promise<string> {
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeId: serviceRecord.id, // if you need actual homeId, pass it down
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

    if (!form.serviceType.trim()) {
      alert("Service type is required");
      return;
    }

    setSaving(true);

    try {
      // Update service record details (API still uses /service-records)
      const res = await fetch(
        `/api/pro/contractor/service-records/${serviceRecordId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceType: form.serviceType,
            serviceDate: form.serviceDate,
            description: form.description || null,
            cost: form.cost || null,
          }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to update service record");
      }

      if (photoFiles.length > 0 || invoiceFile || warrantyFile) {
        setUploading(true);

        const photoUrls: string[] = [];
        for (const file of photoFiles) {
          const url = await uploadFileWithRecordId(file, serviceRecordId);
          photoUrls.push(url);
        }

        const invoiceUrl = invoiceFile
          ? await uploadFileWithRecordId(invoiceFile, serviceRecordId)
          : null;

        const warrantyUrl = warrantyFile
          ? await uploadFileWithRecordId(warrantyFile, serviceRecordId)
          : null;

        await fetch(`/api/pro/contractor/service-records/${serviceRecordId}`, {
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

      alert("Service record updated successfully");
      onCloseAction();
      router.refresh();
    } catch (error) {
      console.error("Failed to update service record:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update service record"
      );
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
    <Modal open={open} onCloseAction={onCloseAction} title="Edit Service Record">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={fieldLabel}>Service Type</span>
          <Input
            value={form.serviceType}
            onChange={(e) => set("serviceType", e.target.value)}
            placeholder="e.g., HVAC Repair"
            required
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>Service Date</span>
          <Input
            type="date"
            value={form.serviceDate}
            onChange={(e) => set("serviceDate", e.target.value)}
            required
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>Service Cost</span>
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
            placeholder="Describe the service performed..."
          />
        </label>

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
              {photoFiles.length} photo
              {photoFiles.length !== 1 ? "s" : ""} selected
            </p>
          )}
        </label>

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
          <GhostButton type="button" onClick={onCloseAction} disabled={saving || uploading}>
            Cancel
          </GhostButton>
          <Button type="submit" disabled={saving || uploading}>
            {uploading
              ? "Uploading files..."
              : saving
              ? "Saving..."
              : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}