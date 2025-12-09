"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { X, Upload } from "lucide-react";

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

type PhotoFile = {
  file: File;
  preview: string;
};

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

export function RequestServiceForm({ homeId, connections }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [form, setForm] = useState({
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

  const handleContractorChange = (connectionId: string) => {
    const connection = connections.find((c) => c.id === connectionId);
    if (connection?.contractor) {
      setForm({
        ...form,
        connectionId,
        contractorId: connection.contractor.id,
      });
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setUploadError(null);

    // Validate total number of photos
    if (photos.length + files.length > MAX_PHOTOS) {
      setUploadError(`You can only upload up to ${MAX_PHOTOS} photos`);
      return;
    }

    // Validate each file
    const validFiles: PhotoFile[] = [];
    for (const file of files) {
      // Check file type
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setUploadError(`${file.name} is not a supported image format. Please use JPG, PNG, or WebP.`);
        continue;
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(`${file.name} is too large. Maximum file size is 10MB.`);
        continue;
      }

      // Create preview
      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview });
    }

    setPhotos([...photos, ...validFiles]);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    // Revoke the object URL to free memory
    URL.revokeObjectURL(newPhotos[index].preview);
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  /**
   * Upload photos using the existing presigned URL system
   * This follows the same pattern as work record attachments
   */
  const uploadPhotos = async (serviceRequestId: string): Promise<string[]> => {
    if (photos.length === 0) return [];

    setUploadingPhotos(true);
    const uploadedUrls: string[] = [];

    try {
      for (const photo of photos) {
        // Step 1: Get presigned URL from your existing endpoint
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeId,
            recordId: serviceRequestId, // Using service request ID as the entity ID
            filename: photo.file.name,
            contentType: photo.file.type,
            size: photo.file.size,
          }),
        });

        if (!presignRes.ok) {
          const error = await presignRes.json();
          throw new Error(error.error || "Failed to get upload URL");
        }

        const { url, publicUrl } = await presignRes.json();

        // Step 2: Upload file to S3 using presigned URL
        const uploadRes = await fetch(url, {
          method: "PUT",
          body: photo.file,
          headers: {
            "Content-Type": photo.file.type,
          },
        });

        if (!uploadRes.ok) {
          throw new Error(`Failed to upload ${photo.file.name}`);
        }

        // Step 3: Store the public URL
        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading photos:", error);
      throw error;
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
      // Convert timeframe to actual date
      let desiredDate: string | null = null;
      const today = new Date();

      if (form.timeframe === "TODAY") {
        desiredDate = today.toISOString();
      } else if (form.timeframe === "ASAP") {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        desiredDate = tomorrow.toISOString();
      } else if (form.timeframe === "SOON") {
        const threeDays = new Date(today);
        threeDays.setDate(threeDays.getDate() + 3);
        desiredDate = threeDays.toISOString();
      } else if (form.timeframe === "1-2_WEEKS") {
        const oneWeek = new Date(today);
        oneWeek.setDate(oneWeek.getDate() + 7);
        desiredDate = oneWeek.toISOString();
      }

      // Step 1: Create job request first (without photos)
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
          photos: [], // Empty for now
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create service request");
      }

      const { serviceRequest } = await res.json();

      // Step 2: Upload photos using presigned URLs (if any)
      let photoUrls: string[] = [];
      if (photos.length > 0) {
        try {
          photoUrls = await uploadPhotos(serviceRequest.id);

          // Step 3: Update job request with photo URLs
          const updateRes = await fetch(`/api/home/${homeId}/service-requests/${serviceRequest.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              photos: photoUrls,
            }),
          });

          if (!updateRes.ok) {
            console.error("Failed to update job request with photos");
            // Don't fail the whole request if photo update fails
          }
        } catch (photoError) {
          console.error("Error uploading photos:", photoError);
          // Continue anyway - job request was created
          alert("Job request created but some photos failed to upload");
        }
      }

      // Clean up object URLs
      photos.forEach((photo) => URL.revokeObjectURL(photo.preview));

      // Redirect to the job request detail page
      router.push(`/home/${homeId}/service-requests/${serviceRequest.id}`);
    } catch (error) {
      console.error("Error creating job request:", error);
      alert(error instanceof Error ? error.message : "Failed to create job request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contractor Selection */}
      <div>
        <label className="block">
          <span className={`${fieldLabel} flex items-center gap-1`}>
            Select Contractor
            <span className="text-red-400">*</span>
          </span>
          <select
            value={form.connectionId}
            onChange={(e) => handleContractorChange(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          >
            <option value="">Choose a contractor...</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.contractor?.proProfile?.businessName ||
                  conn.contractor?.name ||
                  conn.contractor?.email}
                {conn.contractor?.proProfile?.verified && " ✓"}
              </option>
            ))}
          </select>
        </label>

        {/* Show contractor details when selected */}
        {form.connectionId && (() => {
          const selected = connections.find((c) => c.id === form.connectionId);
          const contractor = selected?.contractor;
          const profile = contractor?.proProfile;

          if (!contractor) return null;

          return (
            <div className="mt-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-start gap-3">
                {contractor.image && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={contractor.image}
                      alt={contractor.name || "Contractor"}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {profile?.businessName || contractor.name}
                    {profile?.verified && (
                      <span className="ml-2 text-xs text-green-400">✓ Verified</span>
                    )}
                  </p>
                  {profile?.specialties && profile.specialties.length > 0 && (
                    <p className="mt-1 text-xs text-white/60">
                      {profile.specialties.join(", ")}
                    </p>
                  )}
                  {profile?.rating && (
                    <p className="mt-1 text-xs text-white/60">
                      ⭐ {profile.rating.toFixed(1)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Work Title */}
      <div>
        <label className="block">
          <span className={`${fieldLabel} flex items-center gap-1`}>
            What work do you need?
            <span className="text-red-400">*</span>
          </span>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Fix leaking faucet in master bathroom"
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            maxLength={100}
            required
          />
        </label>
      </div>

      {/* Description */}
      <div>
        <label className="block">
          <span className={`${fieldLabel} flex items-center gap-1`}>
            Description
            <span className="text-red-400">*</span>
          </span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={6}
            placeholder="Describe the work you need done in detail. Include any specific requirements, preferences, or concerns..."
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            required
          />
        </label>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block">
          <span className={fieldLabel}>Photos (Optional)</span>
          <p className="mt-1 text-xs text-white/60">
            Add photos to help the contractor understand the work needed. Max {MAX_PHOTOS} photos, 10MB each.
          </p>
        </label>

        {/* Upload Button */}
        <div className="mt-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= MAX_PHOTOS}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            <span>Upload Photos</span>
          </button>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mt-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {uploadError}
          </div>
        )}

        {/* Photo Previews */}
        {photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
              >
                <Image
                  src={photo.preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition group-hover:opacity-100"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
              </div>
            ))}
          </div>
        )}

        {photos.length > 0 && (
          <p className="mt-2 text-xs text-white/60">
            {photos.length} of {MAX_PHOTOS} photos selected
          </p>
        )}
      </div>

      {/* Category & Urgency */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block">
            <span className={fieldLabel}>Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block">
            <span className={fieldLabel}>Urgency</span>
            <select
              value={form.urgency}
              onChange={(e) => setForm({ ...form, urgency: e.target.value })}
              className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="LOW">Low - Can wait</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High - Soon</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
          </label>
        </div>
      </div>

      {/* Budget Range */}
      <div>
        <span className={`${fieldLabel} mb-2 block`}>Budget Range (Optional)</span>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Minimum ($)</span>
              <input
                type="number"
                value={form.budgetMin}
                onChange={(e) => setForm({ ...form, budgetMin: e.target.value })}
                placeholder="Min"
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>

          <div>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">Maximum ($)</span>
              <input
                type="number"
                value={form.budgetMax}
                onChange={(e) => setForm({ ...form, budgetMax: e.target.value })}
                placeholder="Max"
                min="0"
                step="0.01"
                className="block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder-white/40 backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Timeframe */}
      <div>
        <label className="block">
          <span className={fieldLabel}>When do you need this done?</span>
          <select
            value={form.timeframe}
            onChange={(e) => setForm({ ...form, timeframe: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white backdrop-blur-sm focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="">Select timeframe...</option>
            <option value="TODAY">Today</option>
            <option value="ASAP">ASAP (within 1-2 days)</option>
            <option value="SOON">Soon (within 3-5 days)</option>
            <option value="1-2_WEEKS">1-2 Weeks</option>
            <option value="NO_RUSH">No Rush</option>
          </select>
          <p className="mt-1 text-xs text-white/60">
            Give the contractor an idea of your timeline
          </p>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <GhostButton
          type="button"
          onClick={() => router.back()}
          disabled={submitting || uploadingPhotos}
        >
          Cancel
        </GhostButton>
        <Button type="submit" disabled={submitting || uploadingPhotos}>
          {uploadingPhotos
            ? "Uploading photos..."
            : submitting
            ? "Sending Request..."
            : "Send Request"}
        </Button>
      </div>
    </form>
  );
}