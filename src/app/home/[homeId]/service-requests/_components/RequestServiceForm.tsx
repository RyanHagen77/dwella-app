"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, GhostButton } from "@/components/ui/Button";
import { Upload } from "lucide-react";

type Connection = {
  id: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      verified: boolean;
      rating: number | null;
      specialties: string[];
    } | null;
  } | null;
};

type Props = {
  homeId: string;
  connections: Connection[];
};

type PhotoFile = { file: File; preview: string };

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Carpentry",
  "Painting",
  "Roofing",
  "Appliance Repair",
  "Landscaping",
  "Flooring",
  "Drywall",
  "Windows & Doors",
  "General Repair",
  "Other",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PHOTOS = 10;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/* =========================
   Field system (no rings)
   ========================= */

const fieldShell =
  "rounded-2xl border border-white/20 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

const controlReset =
  "border-0 ring-0 outline-none focus:ring-0 focus:outline-none focus-visible:outline-none focus-visible:ring-0 " +
  "[-webkit-tap-highlight-color:transparent] " +
  "autofill:shadow-[0_0_0px_1000px_rgba(0,0,0,0.35)_inset] " +
  "autofill:[-webkit-text-fill-color:#fff]";

const fieldInner =
  "w-full bg-transparent px-4 py-2.5 text-white placeholder:text-white/40 " +
  "text-base sm:text-sm " +
  controlReset;

const textareaInner =
  "w-full bg-transparent px-4 py-3 text-white placeholder:text-white/40 " +
  "resize-none min-h-[140px] " +
  "text-base sm:text-sm " +
  controlReset;

const selectInner =
  "w-full bg-transparent px-4 py-2.5 text-white appearance-none pr-10 " +
  "text-base sm:text-sm " +
  controlReset;

const labelCaps =
  "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

/* =========================
   Clean surfaces (NO washed cards)
   ========================= */

const sectionSurface = "rounded-2xl border border-white/15 bg-black/25 p-4";

const quietButton =
  "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 " +
  "transition-colors hover:bg-white/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const helperText = "mt-2 text-sm text-white/60";

function Chevron() {
  return (
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
      ▾
    </span>
  );
}

export function RequestServiceForm({ homeId, connections }: Props) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = React.useState(false);
  const [uploadingPhotos, setUploadingPhotos] = React.useState(false);
  const [photos, setPhotos] = React.useState<PhotoFile[]>([]);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    connectionId: "",
    contractorId: "",
    title: "",
    description: "",
    category: "",
    urgency: "NORMAL",
    budgetMin: "",
    budgetMax: "",
    timeframe: "",
  });

  // cleanup previews on unmount
  React.useEffect(() => {
    return () => photos.forEach((p) => URL.revokeObjectURL(p.preview));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleContractorChange = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (connection?.contractor) {
      setForm((f) => ({
        ...f,
        connectionId,
        contractorId: connection.contractor!.id,
      }));
    } else {
      setForm((f) => ({ ...f, connectionId, contractorId: "" }));
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);

    if (photos.length + files.length > MAX_PHOTOS) {
      setUploadError(`You can only upload up to ${MAX_PHOTOS} photos`);
      return;
    }

    const validFiles: PhotoFile[] = [];
    for (const file of files) {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setUploadError(`${file.name} is not supported. Use JPG, PNG, or WebP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name} is too large. Max file size is 10MB.`);
        continue;
      }
      validFiles.push({ file, preview: URL.createObjectURL(file) });
    }

    if (validFiles.length) setPhotos((p) => [...p, ...validFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const target = photos[index];
    if (target) URL.revokeObjectURL(target.preview);
    setPhotos((p) => p.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (serviceRequestId: string): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeId,
            recordId: serviceRequestId,
            filename: photo.file.name,
            contentType: photo.file.type || "application/octet-stream",
            size: photo.file.size,
          }),
        });

        if (!presignRes.ok) {
          const err = await presignRes.json().catch(() => ({}));
          throw new Error(err.error || "Failed to get upload URL");
        }

        const { url, publicUrl } = (await presignRes.json()) as {
          url: string;
          publicUrl: string;
        };

        const uploadRes = await fetch(url, {
          method: "PUT",
          body: photo.file,
          headers: { "Content-Type": photo.file.type || "application/octet-stream" },
        });

        if (!uploadRes.ok) throw new Error(`Failed to upload ${photo.file.name}`);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.connectionId || !form.contractorId || !form.title || !form.description) {
      alert("Please fill in contractor, title, and description");
      return;
    }

    setSubmitting(true);
    try {
      // timeframe -> desiredDate
      let desiredDate: string | null = null;
      const today = new Date();

      if (form.timeframe === "TODAY") desiredDate = today.toISOString();
      else if (form.timeframe === "ASAP") {
        const t = new Date(today);
        t.setDate(t.getDate() + 1);
        desiredDate = t.toISOString();
      } else if (form.timeframe === "SOON") {
        const t = new Date(today);
        t.setDate(t.getDate() + 3);
        desiredDate = t.toISOString();
      } else if (form.timeframe === "1-2_WEEKS") {
        const t = new Date(today);
        t.setDate(t.getDate() + 7);
        desiredDate = t.toISOString();
      }

      const res = await fetch(`/api/home/${homeId}/service-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connectionId: form.connectionId,
          contractorId: form.contractorId,
          title: form.title,
          description: form.description,
          category: form.category || null,
          urgency: form.urgency,
          budgetMin: form.budgetMin ? parseFloat(form.budgetMin) : null,
          budgetMax: form.budgetMax ? parseFloat(form.budgetMax) : null,
          desiredDate,
          photos: [],
        }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to create service request");
      }

      const { serviceRequest } = (await res.json()) as { serviceRequest: { id: string } };

      if (photos.length > 0) {
        try {
          const photoUrls = await uploadPhotos(serviceRequest.id);
          const updateRes = await fetch(
            `/api/home/${homeId}/service-requests/${serviceRequest.id}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ photos: photoUrls }),
            }
          );
          if (!updateRes.ok) console.error("Failed to update job request with photos");
        } catch (photoError) {
          console.error("Error uploading photos:", photoError);
          alert("Job request created but some photos failed to upload");
        }
      }

      photos.forEach((p) => URL.revokeObjectURL(p.preview));
      setPhotos([]);

      router.push(`/home/${homeId}/service-requests/${serviceRequest.id}`);
    } catch (error) {
      console.error("Error creating job request:", error);
      alert(error instanceof Error ? error.message : "Failed to create job request");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedConn = form.connectionId
    ? connections.find((c) => c.id === form.connectionId)
    : null;

  const contractor = selectedConn?.contractor ?? null;
  const profile = contractor?.proProfile ?? null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contractor */}
      <div>
        <label className="block">
          <span className={labelCaps}>
            Select contractor <span className="text-red-400">*</span>
          </span>

          <div className={`${fieldShell} relative`}>
            <select
              value={form.connectionId}
              onChange={(e) => handleContractorChange(e.target.value)}
              className={selectInner}
              required
            >
              <option value="" className="bg-gray-900">
                Choose a contractor…
              </option>
              {connections.map((conn) => (
                <option key={conn.id} value={conn.id} className="bg-gray-900">
                  {conn.contractor?.proProfile?.businessName ||
                    conn.contractor?.name ||
                    conn.contractor?.email}
                  {conn.contractor?.proProfile?.verified ? " ✓" : ""}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </label>

        {contractor && (
          <div className={`mt-3 ${sectionSurface}`}>
            <div className="flex items-start gap-3">
              {contractor.image ? (
                <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full border border-white/15 bg-black/20">
                  <Image
                    src={contractor.image}
                    alt={contractor.name || "Contractor"}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 flex-shrink-0 rounded-full border border-white/15 bg-black/20" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {profile?.businessName || contractor.name || contractor.email}
                  </p>
                  {profile?.verified ? <span className="text-xs text-green-400">✓ Verified</span> : null}
                </div>

                {profile?.specialties?.length ? (
                  <p className="mt-1 text-xs text-white/60">{profile.specialties.join(", ")}</p>
                ) : null}

                {profile?.rating ? (
                  <p className="mt-1 text-xs text-white/60">⭐ {profile.rating.toFixed(1)}</p>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Title */}
      <label className="block">
        <span className={labelCaps}>
          What work do you need? <span className="text-red-400">*</span>
        </span>
        <div className={fieldShell}>
          <input
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="e.g. Fix leaking faucet in master bathroom"
            className={fieldInner}
            maxLength={100}
            required
          />
        </div>
      </label>

      {/* Description */}
      <label className="block">
        <span className={labelCaps}>
          Description <span className="text-red-400">*</span>
        </span>
        <div className={fieldShell}>
          <textarea
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            rows={6}
            placeholder="Describe the work you need done in detail..."
            className={textareaInner}
            required
          />
        </div>
      </label>

      {/* Photos */}
      <div>
        <div className={labelCaps}>Photos (optional)</div>
        <p className="mt-1 text-xs text-white/60">
          Max {MAX_PHOTOS} photos, 10MB each. JPG / PNG / WebP.
        </p>

        <div className="mt-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handlePhotoSelect}
            className="sr-only"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className={quietButton}
          >
            <Upload className="h-4 w-4" />
            Upload photos
          </button>
        </div>

        {uploadError && (
          <div className="mt-3 rounded-2xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">
            {uploadError}
          </div>
        )}

        {photos.length > 0 && (
          <>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative flex-shrink-0 overflow-hidden rounded-xl border border-white/15 bg-black/20"
                >
                  <Image
                    src={photo.preview}
                    alt={`Preview ${index + 1}`}
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -right-1.5 -top-1.5 rounded-full border border-white/25 bg-black/70 px-2 py-0.5 text-xs text-white/90 transition-colors hover:border-white/40"
                    aria-label="Remove photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <p className="mt-2 text-xs text-white/60">
              {photos.length} of {MAX_PHOTOS} selected
            </p>
          </>
        )}
      </div>

      {/* Category + Urgency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelCaps}>Category</span>
          <div className={`${fieldShell} relative`}>
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className={selectInner}>
              <option value="" className="bg-gray-900">
                Select category…
              </option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-gray-900">
                  {cat}
                </option>
              ))}
            </select>
            <Chevron />
          </div>
        </label>

        <label className="block">
          <span className={labelCaps}>Urgency</span>
          <div className={`${fieldShell} relative`}>
            <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)} className={selectInner}>
              <option value="LOW" className="bg-gray-900">
                Low - Can wait
              </option>
              <option value="NORMAL" className="bg-gray-900">
                Normal
              </option>
              <option value="HIGH" className="bg-gray-900">
                High - Soon
              </option>
              <option value="EMERGENCY" className="bg-gray-900">
                Emergency
              </option>
            </select>
            <Chevron />
          </div>
        </label>
      </div>

      {/* Budget */}
      <div>
        <div className={labelCaps}>Budget range (optional)</div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Minimum ($)
            </span>
            <div className={fieldShell}>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                placeholder="Min"
                className={fieldInner}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/45">
              Maximum ($)
            </span>
            <div className={fieldShell}>
              <input
                type="number"
                min={0}
                step="0.01"
                inputMode="decimal"
                value={form.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                placeholder="Max"
                className={fieldInner}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Timeframe */}
      <label className="block">
        <span className={labelCaps}>When do you need this done?</span>

        <div className={`${fieldShell} relative`}>
          <select value={form.timeframe} onChange={(e) => set("timeframe", e.target.value)} className={selectInner}>
            <option value="" className="bg-gray-900">
              Select timeframe…
            </option>
            <option value="TODAY" className="bg-gray-900">
              Today
            </option>
            <option value="ASAP" className="bg-gray-900">
              ASAP (within 1-2 days)
            </option>
            <option value="SOON" className="bg-gray-900">
              Soon (within 3-5 days)
            </option>
            <option value="1-2_WEEKS" className="bg-gray-900">
              1-2 Weeks
            </option>
            <option value="NO_RUSH" className="bg-gray-900">
              No Rush
            </option>
          </select>
          <Chevron />
        </div>

        <p className={helperText}>Give the contractor an idea of your timeline.</p>
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <GhostButton type="button" onClick={() => router.back()} disabled={submitting || uploadingPhotos}>
          Cancel
        </GhostButton>
        <Button type="submit" disabled={submitting || uploadingPhotos}>
          {uploadingPhotos ? "Uploading photos..." : submitting ? "Sending Request..." : "Send Request"}
        </Button>
      </div>
    </form>
  );
}