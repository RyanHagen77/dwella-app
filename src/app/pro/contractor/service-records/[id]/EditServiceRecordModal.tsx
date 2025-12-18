"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Modal } from "@/components/ui/Modal";
import { fieldLabel } from "@/components/ui";
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
  onClose: () => void;
  serviceRecord: ServiceRecordData;
  serviceRecordId: string;
};

const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/35";

const textareaInner =
  "w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 resize-none min-h-[110px]";

function toDateInputValue(v: string) {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

function FileField({
  label,
  accept,
  multiple,
  onChange,
  helper,
}: {
  label: string;
  accept?: string;
  multiple?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  helper?: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <div className={fieldShell}>
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChange}
          className={[
            "w-full bg-transparent px-4 py-2 text-sm text-white outline-none",
            "file:mr-4 file:rounded-lg file:border-0 file:bg-white/15 file:px-3 file:py-2 file:text-xs file:text-white",
            "hover:file:bg-white/20",
            "focus:outline-none focus:ring-0",
          ].join(" ")}
        />
      </div>
      {helper ? <div className="mt-1 text-xs text-white/55">{helper}</div> : null}
    </label>
  );
}

export function EditServiceRecordModal({
  open,
  onClose,
  serviceRecord,
  serviceRecordId,
}: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    serviceType: serviceRecord.serviceType || "",
    serviceDate: toDateInputValue(serviceRecord.serviceDate),
    description: serviceRecord.description || "",
    cost: serviceRecord.cost ?? null,
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [warrantyFile, setWarrantyFile] = useState<File | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm({
      serviceType: serviceRecord.serviceType || "",
      serviceDate: toDateInputValue(serviceRecord.serviceDate),
      description: serviceRecord.description || "",
      cost: serviceRecord.cost ?? null,
    });
    setPhotoFiles([]);
    setInvoiceFile(null);
    setWarrantyFile(null);
  }, [open, serviceRecord]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function uploadFileWithRecordId(file: File, recordId: string): Promise<string> {
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId,
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!presignResponse.ok) {
      const error = (await presignResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(error?.error || "Failed to get upload URL");
    }

    const presignJson = (await presignResponse.json()) as { url: string; publicUrl: string };

    const uploadResponse = await fetch(presignJson.url, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload file to storage");
    return presignJson.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.serviceType.trim()) return alert("Service type is required");
    if (!form.serviceDate) return alert("Service date is required");

    setSaving(true);

    try {
      const res = await fetch(`/api/pro/contractor/service-records/${serviceRecordId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: form.serviceType.trim(),
          serviceDate: form.serviceDate,
          description: form.description?.trim() ? form.description.trim() : null,
          cost: form.cost != null && !Number.isNaN(Number(form.cost)) ? Number(form.cost) : null,
        }),
      });

      if (!res.ok) {
        const error = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(error?.error || "Failed to update service record");
      }

      if (photoFiles.length > 0 || invoiceFile || warrantyFile) {
        setUploading(true);

        const photoUrls: string[] = [];
        for (const file of photoFiles) photoUrls.push(await uploadFileWithRecordId(file, serviceRecordId));

        const invoiceUrl = invoiceFile ? await uploadFileWithRecordId(invoiceFile, serviceRecordId) : null;
        const warrantyUrl = warrantyFile ? await uploadFileWithRecordId(warrantyFile, serviceRecordId) : null;

        const patchFilesRes = await fetch(`/api/pro/contractor/service-records/${serviceRecordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(photoUrls.length ? { photos: photoUrls } : {}),
            ...(invoiceUrl ? { invoice: invoiceUrl } : {}),
            ...(warrantyUrl ? { warranty: warrantyUrl } : {}),
          }),
        });

        if (!patchFilesRes.ok) {
          const error = (await patchFilesRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(error?.error || "Failed to attach uploaded files");
        }

        setUploading(false);
      }

      onClose();
      router.refresh();
    } catch (error) {
      console.error("Failed to update service record:", error);
      alert(error instanceof Error ? error.message : "Failed to update service record");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  const busy = saving || uploading;

  return (
    <Modal open={open} onClose={onClose} title="Edit Service Record">
      {/* ✅ Make modal body scrollable so it never gets stuck off-screen */}
      <div className="max-h-[75vh] overflow-y-auto pr-1 -mr-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Service Type *</span>
            <div className={fieldShell}>
              <input
                className={fieldInner}
                value={form.serviceType}
                onChange={(e) => set("serviceType", e.target.value)}
                placeholder="e.g., HVAC Repair"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className={fieldLabel}>Service Date *</span>
            <div className={fieldShell}>
              <input
                type="date"
                className={fieldInner}
                value={form.serviceDate}
                onChange={(e) => set("serviceDate", e.target.value)}
                required
              />
            </div>
          </label>

          <label className="block">
            <span className={fieldLabel}>Service Cost</span>
            <div className={fieldShell}>
              <input
                type="number"
                min="0"
                step="0.01"
                className={fieldInner}
                value={form.cost ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  set("cost", v === "" ? null : Number(v));
                }}
                placeholder="0.00"
              />
            </div>
          </label>

          <label className="block">
            <span className={fieldLabel}>Description</span>
            <div className={fieldShell}>
              <textarea
                className={textareaInner}
                rows={4}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the service performed..."
              />
            </div>
          </label>

          <div className="pt-1 space-y-3">
            <FileField
              label="Add Photos"
              accept="image/*"
              multiple
              onChange={(e) => setPhotoFiles(e.target.files ? Array.from(e.target.files) : [])}
              helper={photoFiles.length ? `${photoFiles.length} selected` : "Optional"}
            />
            <FileField
              label="Add Invoice (PDF)"
              accept=".pdf"
              onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
              helper={invoiceFile ? invoiceFile.name : "Optional"}
            />
            <FileField
              label="Add Warranty (PDF)"
              accept=".pdf"
              onChange={(e) => setWarrantyFile(e.target.files?.[0] ?? null)}
              helper={warrantyFile ? warrantyFile.name : "Optional"}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <GhostButton type="button" onClick={onClose} disabled={busy}>
              Cancel
            </GhostButton>
            <Button type="submit" disabled={busy}>
              {uploading ? "Uploading files..." : saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}