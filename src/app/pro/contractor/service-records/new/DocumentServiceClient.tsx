"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { glass, heading, textMeta, ctaGhost } from "@/lib/glass";
import { fieldLabel } from "@/components/ui";
import { Button } from "@/components/ui/Button";
import AddressVerification from "@/components/AddressVerification";

/* ========================
   Types
======================== */

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
    category: "photo" | "invoice" | "warranty";
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }[];
};

/* ========================
   Field styles (MATCH service records list controls)
======================== */

const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/35";

const selectInner =
  fieldInner + " appearance-none pr-10 focus:outline-none ring-0 focus:ring-0";

const textareaInner =
  "w-full bg-transparent px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 resize-none min-h-[110px]";

/* ========================
   File field
======================== */

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
            "placeholder:text-white/35",
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

/* ========================
   Component
======================== */

export function DocumentServiceClient({ connectedHomes }: DocumentServiceClientProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [mode, setMode] = useState<"connected" | "address">(
    connectedHomes.length > 0 ? "connected" : "address"
  );

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

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

  /* ========================
     Upload helper
  ======================== */

  async function uploadFileWithRecordId(
    file: File,
    recordId: string,
    category: "photo" | "invoice" | "warranty"
  ): Promise<string> {
    const res = await fetch(`/api/pro/contractor/service-records/${recordId}/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        files: [{ name: file.name, type: file.type, size: file.size, category }],
      }),
    });

    if (!res.ok) {
      const j = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(j?.error || "Failed to get upload URL");
    }

    const json = (await res.json()) as PresignResponse;
    const info = json.uploadUrls?.[0];
    if (!info?.uploadUrl || !info.publicUrl) throw new Error("Invalid upload response");

    const upload = await fetch(info.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!upload.ok) throw new Error("Upload failed");
    return info.publicUrl;
  }

  /* ========================
     Submit
  ======================== */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.serviceType.trim()) return alert("Work type is required.");
    if (mode === "connected" && !form.homeId) return alert("Select a property.");
    if (mode === "address" && !verifiedAddress) return alert("Please verify the address.");
    if (form.warrantyIncluded && !form.warrantyItem.trim())
      return alert("Warranty item is required when a warranty is included.");

    setSaving(true);

    try {
      const costNum =
        form.cost.trim() && !Number.isNaN(Number(form.cost)) ? Number(form.cost) : null;

      const createBody: Record<string, unknown> = {
        serviceType: form.serviceType.trim(),
        serviceDate: form.serviceDate,
        cost: costNum,
        description: form.description.trim() ? form.description.trim() : null,
        warrantyIncluded: form.warrantyIncluded,
      };

      if (mode === "connected") {
        createBody.homeId = form.homeId;
      } else if (verifiedAddress) {
        createBody.address = {
          street: verifiedAddress.street,
          unit: verifiedAddress.unit ?? null,
          city: verifiedAddress.city,
          state: verifiedAddress.state,
          zip: verifiedAddress.zip,
        };
      }

      const createRes = await fetch("/api/pro/contractor/service-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });

      const createJson = (await createRes.json().catch(() => null)) as
        | { error?: string; serviceRecord?: { id: string } }
        | null;

      if (!createRes.ok || !createJson?.serviceRecord?.id) {
        throw new Error(createJson?.error || "Failed to create record");
      }

      const recordId = createJson.serviceRecord.id;

      // uploads
      setUploading(true);

      const photos: string[] = [];
      for (const f of photoFiles) {
        photos.push(await uploadFileWithRecordId(f, recordId, "photo"));
      }

      const invoice = invoiceFile ? await uploadFileWithRecordId(invoiceFile, recordId, "invoice") : null;
      const warranty = warrantyFile ? await uploadFileWithRecordId(warrantyFile, recordId, "warranty") : null;

      setUploading(false);

      // patch
      const patchBody: Record<string, unknown> = {
        ...(photos.length ? { photos } : {}),
        ...(invoice ? { invoice } : {}),
        ...(warranty ? { warranty } : {}),
      };

      if (form.warrantyIncluded) {
        patchBody.warrantyIncluded = true;
        patchBody.warrantyItem = form.warrantyItem.trim() || null;
        patchBody.warrantyProvider = form.warrantyProvider.trim() || null;
        patchBody.warrantyPolicyNo = form.warrantyPolicyNo.trim() || null;
        patchBody.warrantyPurchasedAt = form.warrantyPurchasedAt || null;
        patchBody.warrantyExpiresAt = form.warrantyExpiresAt || null;
        patchBody.warrantyNote = form.warrantyNote.trim() || null;
      }

      if (Object.keys(patchBody).length > 0) {
        const patchRes = await fetch(`/api/pro/contractor/service-records/${recordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });

        if (!patchRes.ok) {
          const j = (await patchRes.json().catch(() => null)) as { error?: string } | null;
          throw new Error(j?.error || "Failed to finalize record");
        }
      }

      router.push(`/pro/contractor/service-records/${recordId}`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  }

  const isSubmitting = saving || uploading;

  /* ========================
     Render
  ======================== */

  return (
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
                mode === "connected"
                  ? "bg-white/90 text-black font-medium"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              Connected client home
            </button>
            <button
              type="button"
              onClick={() => setMode("address")}
              className={`px-3 py-1 rounded-full transition ${
                mode === "address"
                  ? "bg-white/90 text-black font-medium"
                  : "text-white/70 hover:bg-white/10"
              }`}
            >
              Any property by address
            </button>
          </div>
        ) : (
          <p className={`mb-4 text-xs ${textMeta}`}>
            You don&apos;t have any connected homeowners yet. That&apos;s okay — you can still
            document work for any property by verified address.
          </p>
        )}

        {mode === "connected" ? (
          <div className="space-y-4">
            <label className="block">
              <span className={fieldLabel}>Select Property *</span>
              <div className={`${fieldShell} relative`}>
                <select
                  value={form.homeId}
                  onChange={(e) => setForm((p) => ({ ...p, homeId: e.target.value }))}
                  className={selectInner}
                  required
                >
                  <option value="" className="bg-gray-900">
                    Select a property…
                  </option>
                  {connectedHomes.map((h) => (
                    <option key={h.id} value={h.id} className="bg-gray-900">
                      {h.address}
                      {h.city ? `, ${h.city}` : ""}
                      {h.state ? `, ${h.state}` : ""}
                      {h.ownerName ? ` • ${h.ownerName}` : ""}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                  ▾
                </span>
              </div>
            </label>

            {selectedHome ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <div className="text-xs text-white/55">Selected property</div>
                <div className="mt-1 text-sm text-white">{selectedHome.address}</div>
                <div className={`mt-1 text-xs ${textMeta}`}>
                  {[selectedHome.city, selectedHome.state, selectedHome.zip].filter(Boolean).join(", ")}
                  {selectedHome.ownerName ? ` • ${selectedHome.ownerName}` : ""}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <p className={`text-xs ${textMeta}`}>
              Verify the service address. We&apos;ll attach this record to that home, even if no
              homeowner has claimed it yet.
            </p>

            <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
              <AddressVerification onVerified={setVerifiedAddress} />
            </div>

            {verifiedAddress ? (
              <div className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
                <div className="text-xs text-white/55">Verified address</div>
                <div className="mt-1 text-sm text-white">
                  {verifiedAddress.street}
                  {verifiedAddress.unit ? ` ${verifiedAddress.unit}` : ""}
                </div>
                <div className={`mt-1 text-xs ${textMeta}`}>
                  {verifiedAddress.city}, {verifiedAddress.state} {verifiedAddress.zip}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>

      {/* Work Details */}
      <section className={glass}>
        <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Work Details</h2>

        <div className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Work Type *</span>
            <div className={fieldShell}>
              <input
                value={form.serviceType}
                onChange={(e) => setForm((p) => ({ ...p, serviceType: e.target.value }))}
                placeholder="e.g., HVAC repair, chimney sweep, plumbing"
                className={fieldInner}
                required
              />
            </div>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={fieldLabel}>Service Date *</span>
              <div className={fieldShell}>
                <input
                  type="date"
                  value={form.serviceDate}
                  onChange={(e) => setForm((p) => ({ ...p, serviceDate: e.target.value }))}
                  className={fieldInner}
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className={fieldLabel}>Cost</span>
              <div className={fieldShell}>
                <input
                  type="number"
                  step="0.01"
                  value={form.cost}
                  onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                  placeholder="0.00"
                  className={fieldInner}
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className={fieldLabel}>Description</span>
            <div className={fieldShell}>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the work performed..."
                className={textareaInner}
              />
            </div>
          </label>
        </div>
      </section>

      {/* Documentation */}
      <section className={glass}>
        <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Documentation</h2>

        <div className="space-y-4">
          <FileField
            label="Photos"
            accept="image/*"
            multiple
            onChange={(e) => setPhotoFiles(e.target.files ? Array.from(e.target.files) : [])}
            helper={
              photoFiles.length
                ? `${photoFiles.length} photo${photoFiles.length === 1 ? "" : "s"} selected`
                : "Optional — add before/after photos."
            }
          />
          <FileField
            label="Invoice (PDF)"
            accept=".pdf"
            onChange={(e) => setInvoiceFile(e.target.files?.[0] ?? null)}
            helper={invoiceFile ? invoiceFile.name : "Optional — attach an invoice PDF."}
          />
          <FileField
            label="Warranty (PDF)"
            accept=".pdf"
            onChange={(e) => setWarrantyFile(e.target.files?.[0] ?? null)}
            helper={warrantyFile ? warrantyFile.name : "Optional — attach a warranty PDF."}
          />
        </div>
      </section>

      {/* Warranty Details */}
      <section className={glass}>
        <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Warranty Details</h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.warrantyIncluded}
              onChange={(e) => setForm((p) => ({ ...p, warrantyIncluded: e.target.checked }))}
              className="h-4 w-4 rounded border-white/30 bg-black/30"
            />
            <span className="text-sm text-white/85">This work includes a warranty</span>
          </label>

          {form.warrantyIncluded ? (
            <div className="space-y-4">
              <label className="block">
                <span className={fieldLabel}>Covered Item *</span>
                <div className={fieldShell}>
                  <input
                    value={form.warrantyItem}
                    onChange={(e) => setForm((p) => ({ ...p, warrantyItem: e.target.value }))}
                    placeholder="e.g., Water Heater"
                    className={fieldInner}
                    required
                  />
                </div>
              </label>

              <label className="block">
                <span className={fieldLabel}>Provider (optional)</span>
                <div className={fieldShell}>
                  <input
                    value={form.warrantyProvider}
                    onChange={(e) => setForm((p) => ({ ...p, warrantyProvider: e.target.value }))}
                    placeholder="e.g., AO Smith"
                    className={fieldInner}
                  />
                </div>
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabel}>Policy # (optional)</span>
                  <div className={fieldShell}>
                    <input
                      value={form.warrantyPolicyNo}
                      onChange={(e) => setForm((p) => ({ ...p, warrantyPolicyNo: e.target.value }))}
                      placeholder="e.g., WH-123456"
                      className={fieldInner}
                    />
                  </div>
                </label>

                <label className="block">
                  <span className={fieldLabel}>Purchase Date</span>
                  <div className={fieldShell}>
                    <input
                      type="date"
                      value={form.warrantyPurchasedAt}
                      onChange={(e) => setForm((p) => ({ ...p, warrantyPurchasedAt: e.target.value }))}
                      className={fieldInner}
                    />
                  </div>
                </label>
              </div>

              <label className="block">
                <span className={fieldLabel}>Expires (optional)</span>
                <div className={fieldShell}>
                  <input
                    type="date"
                    value={form.warrantyExpiresAt}
                    onChange={(e) => setForm((p) => ({ ...p, warrantyExpiresAt: e.target.value }))}
                    className={fieldInner}
                  />
                </div>
              </label>

              <label className="block">
                <span className={fieldLabel}>Warranty Notes (optional)</span>
                <div className={fieldShell}>
                  <textarea
                    value={form.warrantyNote}
                    onChange={(e) => setForm((p) => ({ ...p, warrantyNote: e.target.value }))}
                    placeholder="Coverage details, serial numbers, limitations, etc."
                    className={textareaInner}
                  />
                </div>
              </label>
            </div>
          ) : null}
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/pro/contractor/service-records" className={ctaGhost}>
          Cancel
        </Link>
        <Button
          type="submit"
          disabled={
            isSubmitting ||
            !form.serviceType.trim() ||
            (mode === "connected" && !form.homeId) ||
            (mode === "address" && !verifiedAddress)
          }
        >
          {uploading ? "Uploading files..." : saving ? "Creating..." : "Document Work"}
        </Button>
      </div>
    </form>
  );
}