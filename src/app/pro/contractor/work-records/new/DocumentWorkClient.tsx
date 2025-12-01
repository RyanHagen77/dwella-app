"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { glass, heading, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button } from "@/components/ui/Button";

type ConnectedHome = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  ownerName: string | null;
};

type WorkForm = {
  homeId: string;
  workType: string;
  workDate: string;
  cost: string;
  description: string;
};

type DocumentWorkClientProps = {
  connectedHomes: ConnectedHome[];
};

export function DocumentWorkClient({ connectedHomes }: DocumentWorkClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState<WorkForm>({
    homeId: "",
    workType: "",
    workDate: new Date().toISOString().slice(0, 10),
    cost: "",
    description: "",
  });

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [warrantyFile, setWarrantyFile] = useState<File | null>(null);

  const selectedHome = connectedHomes.find(h => h.id === form.homeId);

  async function uploadFileWithRecordId(file: File, homeId: string, recordId: string): Promise<string> {
    // Step 1: Get presigned URL with recordId (contractor endpoint)
    const presignResponse = await fetch("/api/uploads/presign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeId,
        recordId,
        filename: file.name,
        contentType: file.type, // ✅ Changed from mimeType to contentType
        size: file.size,
      }),
    });

    if (!presignResponse.ok) {
      const error = await presignResponse.json();
      throw new Error(error.error || "Failed to get upload URL");
    }

    const { url: uploadUrl, publicUrl } = await presignResponse.json();

    // Step 2: Upload file to S3 using presigned URL
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

    // Step 3: Return the public file URL
    return publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.homeId || !form.workType.trim()) {
      alert("Property and document-completed-work-submissions type are required");
      return;
    }

    setSaving(true);

    try {
      // Step 1: Create document-completed-work-submissions record WITHOUT files first
      const createResponse = await fetch("/api/pro/contractor/work-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId: form.homeId,
          workType: form.workType.trim(),
          workDate: form.workDate,
          cost: form.cost ? parseFloat(form.cost) : null,
          description: form.description.trim(),
          // Don't send files yet
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || "Failed to create document-completed-work-submissions record");
      }

      const { workRecord } = await createResponse.json();
      const recordId = workRecord.id;

      // Step 2: Now upload files with the recordId
      setUploading(true);

      const photoUrls: string[] = [];
      for (const file of photoFiles) {
        const url = await uploadFileWithRecordId(file, form.homeId, recordId);
        photoUrls.push(url);
      }

      const invoiceUrl = invoiceFile
        ? await uploadFileWithRecordId(invoiceFile, form.homeId, recordId)
        : null;

      const warrantyUrl = warrantyFile
        ? await uploadFileWithRecordId(warrantyFile, form.homeId, recordId)
        : null;

      setUploading(false);

      // Step 3: Update document-completed-work-submissions record with file URLs
      if (photoUrls.length > 0 || invoiceUrl || warrantyUrl) {
        await fetch(`/api/pro/contractor/work-records/${recordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            photos: photoUrls,
            invoice: invoiceUrl,
            warranty: warrantyUrl,
          }),
        });
      }

      // Redirect to the document-completed-work-submissions record detail page
      router.push(`/pro/contractor/work-records/${recordId}`);
    } catch (error) {
      console.error("Error documenting document-completed-work-submissions:", error);
      alert(error instanceof Error ? error.message : "Failed to document document-completed-work-submissions. Please try again.");
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/pro/contractor/work-records"
          className="text-sm text-white/70 transition hover:text-white"
        >
          ← Back to Work Records
        </Link>
      </div>

      <section className={glass}>
        <h1 className={`mb-2 text-2xl font-semibold ${heading}`}>Document Work</h1>
        <p className={textMeta}>
          Add a record of work you&#39;ve completed at a connected property
        </p>
      </section>

      {/* No Connected Properties Warning */}
      {connectedHomes.length === 0 && (
        <section className={glass}>
          <div className="py-8 text-center">
            <div className="mb-4 text-5xl">🏠</div>
            <h2 className="mb-2 text-xl font-semibold text-white">No Connected Properties</h2>
            <p className={`mb-4 ${textMeta}`}>
              You need to connect with a homeowner before documenting work.
            </p>
            <div className="flex justify-center gap-3">
              <Link href="/pro/contractor/invite" className={ctaPrimary}>
                Invite Homeowner
              </Link>
              <Link href="/pro/contractor/invitations" className={ctaGhost}>
                View Sent Invitations
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Form - Only show if there are connected stats */}
      {connectedHomes.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Property Selection */}
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Property</h2>
            <div className="space-y-4">
              <label className="block">
                <span className={fieldLabel}>Select Property *</span>
                <select
                  value={form.homeId}
                  onChange={(e) => setForm({ ...form, homeId: e.target.value })}
                  required
                  className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur transition focus:border-white/30 focus:bg-white/15"
                >
                  <option value="" className="bg-gray-800">Select a property...</option>
                  {connectedHomes.map((home) => (
                    <option key={home.id} value={home.id} className="bg-gray-800">
                      {home.address}
                      {home.city && `, ${home.city}`}
                      {home.state && `, ${home.state}`}
                      {home.ownerName && ` • ${home.ownerName}`}
                    </option>
                  ))}
                </select>
              </label>

              {/* Show selected property details */}
              {selectedHome && (
                <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                  <p className="text-sm font-medium text-white/90">Selected Property:</p>
                  <p className="text-white">{selectedHome.address}</p>
                  {selectedHome.city && (
                    <p className={textMeta}>
                      {selectedHome.city}, {selectedHome.state} {selectedHome.zip}
                    </p>
                  )}
                  {selectedHome.ownerName && (
                    <p className={`mt-1 text-sm ${textMeta}`}>
                      Owner: {selectedHome.ownerName}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Work Details */}
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Work Details</h2>
            <div className="space-y-4">
              <label className="block">
                <span className={fieldLabel}>Work Type *</span>
                <Input
                  value={form.workType}
                  onChange={(e) => setForm({ ...form, workType: e.target.value })}
                  placeholder="e.g., HVAC Repair, Chimney Sweep, Plumbing"
                  required
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Work Date *</span>
                  <Input
                    type="date"
                    value={form.workDate}
                    onChange={(e) => setForm({ ...form, workDate: e.target.value })}
                    required
                  />
                </label>

                <label className="block">
                  <span className={fieldLabel}>Cost</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    placeholder="0.00"
                  />
                </label>
              </div>

              <label className="block">
                <span className={fieldLabel}>Description</span>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Describe the work performed..."
                />
              </label>
            </div>
          </section>

          {/* Documentation */}
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Documentation</h2>
            <div className="space-y-4">
              <label className="block">
                <span className={fieldLabel}>Photos</span>
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

              <label className="block">
                <span className={fieldLabel}>Invoice (PDF)</span>
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
                <span className={fieldLabel}>Warranty (PDF)</span>
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
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Link href="/pro/contractor/work-records" className={ctaGhost}>
              Cancel
            </Link>
            <Button type="submit" disabled={saving || !form.homeId}>
              {uploading ? "Uploading files..." : saving ? "Creating..." : "Document Work"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}