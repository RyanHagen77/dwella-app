"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { glass, heading, textMeta, ctaGhost } from "@/lib/glass";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import AddressVerification from "@/components/AddressVerification";

type ConnectedHome = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  ownerName: string | null;
};

type ServiceForm = {
  homeId: string;
  serviceType: string;
  serviceDate: string;
  cost: string;
  description: string;

  warrantyIncluded: boolean;
  warrantyItem: string;
  warrantyProvider: string;
  warrantyPolicyNo: string;
  warrantyPurchasedAt: string;
  warrantyExpiresAt: string;
  warrantyNote: string;
};

type VerifiedAddress = {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
};

type DocumentServiceClientProps = {
  connectedHomes: ConnectedHome[];
};

type PresignResponse = {
  success: boolean;
  uploadUrls: {
    fileId: string;
    fileName: string;
    category: string;
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }[];
};

export function DocumentServiceClient({ connectedHomes }: DocumentServiceClientProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [mode, setMode] = useState<"connected" | "address">(
    connectedHomes.length > 0 ? "connected" : "address"
  );

  const today = React.useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [form, setForm] = useState<ServiceForm>({
    homeId: "",
    serviceType: "",
    serviceDate: today,
    cost: "",
    description: "",

    warrantyIncluded: false,
    warrantyItem: "",
    warrantyProvider: "",
    warrantyPolicyNo: "",
    warrantyPurchasedAt: today,
    warrantyExpiresAt: "",
    warrantyNote: "",
  });

  const [verifiedAddress, setVerifiedAddress] = useState<VerifiedAddress | null>(null);

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [warrantyFile, setWarrantyFile] = useState<File | null>(null);

  const selectedHome = connectedHomes.find((h) => h.id === form.homeId) || null;

  async function uploadFileWithRecordId(
    file: File,
    recordId: string,
    category: "photo" | "invoice" | "warranty"
  ): Promise<string> {
    const presignResponse = await fetch(`/api/pro/contractor/service-records/${recordId}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: [{ name: file.name, type: file.type, size: file.size, category }],
      }),
    });

    if (!presignResponse.ok) {
      const errorJson = (await presignResponse.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errorJson?.error || "Failed to get upload URL for service record");
    }

    const json = (await presignResponse.json()) as PresignResponse;
    const uploadInfo = json.uploadUrls?.[0];
    if (!uploadInfo?.uploadUrl || !uploadInfo.publicUrl) throw new Error("Invalid upload URL response from server");

    const uploadResponse = await fetch(uploadInfo.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!uploadResponse.ok) throw new Error("Failed to upload file to storage");
    return uploadInfo.publicUrl;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.serviceType.trim()) return alert("Work type is required.");
    if (mode === "connected" && !form.homeId) return alert("Select a property or switch to 'Any property by address'.");
    if (mode === "address" && !verifiedAddress) return alert("Please verify the property address first.");
    if (form.warrantyIncluded && !form.warrantyItem.trim()) return alert("Warranty item is required when a warranty is included.");

    setSaving(true);

    try {
      // Step 1: create record (no files yet)
      const createPayload: {
        serviceType: string;
        serviceDate: string;
        cost: number | null;
        description: string | null;
        homeId?: string;
        address?: { street: string; unit: string | null; city: string; state: string; zip: string };
        warrantyIncluded: boolean;
        // keep these for contractor-facing summary fields if you still use them
        warrantyLength?: string | null;
        warrantyDetails?: string | null;
      } = {
        serviceType: form.serviceType.trim(),
        serviceDate: form.serviceDate,
        cost: form.cost && !Number.isNaN(Number(form.cost)) ? Number(form.cost) : null,
        description: form.description?.trim() ? form.description.trim() : null,
        warrantyIncluded: form.warrantyIncluded,
        // optional: keep old serviceRecord meta fields (not required for the home Warranty table)
        warrantyLength: form.warrantyExpiresAt || null,
        warrantyDetails: form.warrantyNote?.trim() ? form.warrantyNote.trim() : null,
      };

      if (mode === "connected") {
        createPayload.homeId = form.homeId;
      } else if (verifiedAddress) {
        createPayload.address = {
          street: verifiedAddress.street,
          unit: verifiedAddress.unit ?? null,
          city: verifiedAddress.city,
          state: verifiedAddress.state,
          zip: verifiedAddress.zip,
        };
      }

      const createResponse = await fetch("/api/pro/contractor/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createPayload),
      });

      const createJson = (await createResponse.json().catch(() => null)) as
        | { error?: string; serviceRecord?: { id: string } }
        | null;

      if (!createResponse.ok || !createJson?.serviceRecord?.id) {
        throw new Error(createJson?.error || "Failed to create service record");
      }

      const recordId = createJson.serviceRecord.id;

      // Step 2: upload files
      setUploading(true);

      const photoUrls: string[] = [];
      for (const file of photoFiles) photoUrls.push(await uploadFileWithRecordId(file, recordId, "photo"));

      const invoiceUrl = invoiceFile ? await uploadFileWithRecordId(invoiceFile, recordId, "invoice") : null;
      const warrantyUrl = warrantyFile ? await uploadFileWithRecordId(warrantyFile, recordId, "warranty") : null;

      setUploading(false);

      // Step 3: PATCH record with files + structured warranty fields
      const patchBody: Record<string, unknown> = {
        ...(photoUrls.length ? { photos: photoUrls } : {}),
        ...(invoiceUrl ? { invoice: invoiceUrl } : {}),
        ...(warrantyUrl ? { warranty: warrantyUrl } : {}),
      };

      if (form.warrantyIncluded) {
        patchBody.warrantyIncluded = true;

        // ✅ structured warranty fields (THIS is what populates the home Warranty page)
        patchBody.warrantyItem = form.warrantyItem.trim() || null;
        patchBody.warrantyProvider = form.warrantyProvider.trim() || null;
        patchBody.warrantyPolicyNo = form.warrantyPolicyNo.trim() || null;
        patchBody.warrantyPurchasedAt = form.warrantyPurchasedAt || null;
        patchBody.warrantyExpiresAt = form.warrantyExpiresAt || null;
        patchBody.warrantyNote = form.warrantyNote.trim() || null;

        // optional: keep serviceRecord meta in sync too
        patchBody.warrantyLength = form.warrantyExpiresAt || null;
        patchBody.warrantyDetails = form.warrantyNote.trim() || null;
      }

      if (Object.keys(patchBody).length > 0) {
        const patchRes = await fetch(`/api/pro/contractor/service-records/${recordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });

        if (!patchRes.ok) {
          const j = (await patchRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error || "Failed to finalize service record");
        }
      }

      router.push(`/pro/contractor/service-records/${recordId}`);
    } catch (error) {
      console.error("Error documenting service:", error);
      alert(error instanceof Error ? error.message : "Failed to document service. Please try again.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setPhotoFiles(Array.from(e.target.files));
  }
  function handleInvoiceChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setInvoiceFile(e.target.files[0]);
  }
  function handleWarrantyChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.[0]) setWarrantyFile(e.target.files[0]);
  }

  const isSubmitting = saving || uploading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/pro/contractor/service-records" className="text-sm text-white/70 transition hover:text-white">
          ← Back to Service Records
        </Link>
      </div>

      <section className={glass}>
        <h1 className={`mb-2 text-2xl font-semibold ${heading}`}>Document Work</h1>
        <p className={textMeta}>
          Log completed work for any property. If the homeowner claims this home later, they&apos;ll be able to review and verify your record.
        </p>
      </section>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Property</h2>

          {connectedHomes.length > 0 ? (
            <div className="mb-4 inline-flex rounded-full border border-white/20 bg-white/5 p-1 text-xs">
              <button
                type="button"
                onClick={() => setMode("connected")}
                className={`px-3 py-1 rounded-full transition ${
                  mode === "connected" ? "bg-white/90 text-black font-medium" : "text-white/70 hover:bg-white/10"
                }`}
              >
                Connected client home
              </button>
              <button
                type="button"
                onClick={() => setMode("address")}
                className={`px-3 py-1 rounded-full transition ${
                  mode === "address" ? "bg-white/90 text-black font-medium" : "text-white/70 hover:bg-white/10"
                }`}
              >
                Any property by address
              </button>
            </div>
          ) : (
            <p className={`mb-4 text-xs ${textMeta}`}>
              You don&apos;t have any connected homeowners yet. That&apos;s okay — you can still document work for any property by verified address.
            </p>
          )}

          <div className="space-y-4">
            {mode === "connected" && connectedHomes.length > 0 && (
              <>
                <label className="block">
                  <span className={fieldLabel}>Select Property *</span>
                  <select
                    value={form.homeId}
                    onChange={(e) => setForm({ ...form, homeId: e.target.value })}
                    required
                    className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur transition focus:border-white/30 focus:bg-white/15"
                  >
                    <option value="" className="bg-gray-800">
                      Select a property...
                    </option>
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

                {selectedHome && (
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-sm font-medium text-white/90">Selected Property:</p>
                    <p className="text-white">{selectedHome.address}</p>
                    {selectedHome.city && (
                      <p className={textMeta}>
                        {selectedHome.city}, {selectedHome.state} {selectedHome.zip}
                      </p>
                    )}
                    {selectedHome.ownerName && <p className={`mt-1 text-sm ${textMeta}`}>Owner: {selectedHome.ownerName}</p>}
                  </div>
                )}
              </>
            )}

            {mode === "address" && (
              <div className="space-y-4">
                <p className={`text-xs ${textMeta}`}>
                  Verify the service address. We&apos;ll attach this record to that home, even if no homeowner has claimed it yet.
                </p>

                <AddressVerification onVerified={(addr) => setVerifiedAddress(addr)} />

                {verifiedAddress && (
                  <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                    <p className="text-sm font-medium text-white/90">Verified Address:</p>
                    <p className="text-white">
                      {verifiedAddress.street}
                      {verifiedAddress.unit && ` ${verifiedAddress.unit}`}
                    </p>
                    <p className={textMeta}>
                      {verifiedAddress.city}, {verifiedAddress.state} {verifiedAddress.zip}
                    </p>
                  </div>
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
                value={form.serviceType}
                onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
                placeholder="e.g., HVAC repair, chimney sweep, plumbing"
                required
              />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className={fieldLabel}>Service Date *</span>
                <Input
                  type="date"
                  value={form.serviceDate}
                  onChange={(e) => setForm({ ...form, serviceDate: e.target.value })}
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
              {invoiceFile && <p className="mt-1 text-xs text-white/60">{invoiceFile.name}</p>}
            </label>

            <label className="block">
              <span className={fieldLabel}>Warranty (PDF)</span>
              <input
                type="file"
                accept=".pdf"
                onChange={handleWarrantyChange}
                className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none backdrop-blur file:mr-4 file:rounded file:border-0 file:bg-white/20 file:px-4 file:py-2 file:text-sm file:text-white hover:file:bg-white/30"
              />
              {warrantyFile && <p className="mt-1 text-xs text-white/60">{warrantyFile.name}</p>}
            </label>
          </div>
        </section>

        {/* Warranty Details */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Warranty Details</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.warrantyIncluded}
                onChange={(e) => setForm((prev) => ({ ...prev, warrantyIncluded: e.target.checked }))}
                className="h-4 w-4 rounded border-white/30 bg-black/30"
              />
              <span className="text-sm text-white/85">This work includes a warranty</span>
            </label>

            {form.warrantyIncluded && (
              <div className="space-y-4">
                <label className="block">
                  <span className={fieldLabel}>Covered Item *</span>
                  <Input
                    value={form.warrantyItem}
                    onChange={(e) => setForm((prev) => ({ ...prev, warrantyItem: e.target.value }))}
                    placeholder="e.g., Water Heater"
                    required
                  />
                </label>

                <label className="block">
                  <span className={fieldLabel}>Provider (optional)</span>
                  <Input
                    value={form.warrantyProvider}
                    onChange={(e) => setForm((prev) => ({ ...prev, warrantyProvider: e.target.value }))}
                    placeholder="e.g., AO Smith"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className={fieldLabel}>Policy # (optional)</span>
                    <Input
                      value={form.warrantyPolicyNo}
                      onChange={(e) => setForm((prev) => ({ ...prev, warrantyPolicyNo: e.target.value }))}
                      placeholder="e.g., WH-123456"
                    />
                  </label>

                  <label className="block">
                    <span className={fieldLabel}>Purchase Date</span>
                    <Input
                      type="date"
                      value={form.warrantyPurchasedAt}
                      onChange={(e) => setForm((prev) => ({ ...prev, warrantyPurchasedAt: e.target.value }))}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className={fieldLabel}>Expires (optional)</span>
                  <Input
                    type="date"
                    value={form.warrantyExpiresAt}
                    onChange={(e) => setForm((prev) => ({ ...prev, warrantyExpiresAt: e.target.value }))}
                  />
                </label>

                <label className="block">
                  <span className={fieldLabel}>Warranty Notes (optional)</span>
                  <Textarea
                    rows={3}
                    value={form.warrantyNote}
                    onChange={(e) => setForm((prev) => ({ ...prev, warrantyNote: e.target.value }))}
                    placeholder="Coverage details, serial numbers, limitations, etc."
                  />
                </label>
              </div>
            )}
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Link href="/pro/contractor/service-records" className={ctaGhost}>
            Cancel
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting || (mode === "connected" && !form.homeId) || (mode === "address" && !verifiedAddress)}
          >
            {uploading ? "Uploading files..." : saving ? "Creating..." : "Document Work"}
          </Button>
        </div>
      </form>
    </div>
  );
}