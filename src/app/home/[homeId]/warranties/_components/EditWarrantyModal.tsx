"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSession } from "next-auth/react";

import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

import {
  formFieldShell,
  formInputInner,
  formTextareaInner,
  formLabelCaps,
  formHelperText,
  formSectionSurface,
  formQuietButton,
} from "@/components/ui/formFields";

export type WarrantyData = {
  id: string;
  item: string;
  provider: string | null;
  policyNo: string | null;
  expiresAt: Date | string | null;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string; // stored, but we’ll link via /api/.../attachments/:id for safety/consistency
    mimeType: string | null;
    size: number | bigint | null;
    uploadedBy: string;
  }>;
};

type Props = {
  open: boolean;
  onClose: () => void;
  warranty: WarrantyData;
  homeId: string;
};

type UploadedAttachment = {
  storageKey: string;
  url: string;
  filename: string;
  contentType: string;
  size: number;
  visibility: "OWNER";
  notes?: string;
};

function toISODateInput(value: Date | string | null) {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function EditWarrantyModal({ open, onClose, warranty, homeId }: Props) {
  const router = useRouter();
  const { push } = useToast();
  const { data: session } = useSession();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);

  const [form, setForm] = useState(() => ({
    item: warranty.item,
    provider: warranty.provider ?? "",
    policyNo: warranty.policyNo ?? "",
    expiresAt: toISODateInput(warranty.expiresAt),
    note: warranty.note ?? "",
  }));

  const myUserId = session?.user?.id ?? null;

  const visibleExisting = useMemo(
    () => (warranty.attachments ?? []).filter((a) => !deletedAttachmentIds.includes(a.id)),
    [warranty.attachments, deletedAttachmentIds]
  );

  const contractorAttachments = useMemo(() => {
    // Until session loads, treat as “contractor” to avoid incorrectly showing remove buttons.
    if (!myUserId) return visibleExisting;
    return visibleExisting.filter((a) => a.uploadedBy !== myUserId);
  }, [visibleExisting, myUserId]);

  const myAttachments = useMemo(() => {
    if (!myUserId) return [];
    return visibleExisting.filter((a) => a.uploadedBy === myUserId);
  }, [visibleExisting, myUserId]);

  // Reset on open / warranty change
  useEffect(() => {
    if (!open) return;

    setFormError(null);
    setForm({
      item: warranty.item,
      provider: warranty.provider ?? "",
      policyNo: warranty.policyNo ?? "",
      expiresAt: toISODateInput(warranty.expiresAt),
      note: warranty.note ?? "",
    });

    previews.forEach((u) => URL.revokeObjectURL(u));
    setFiles([]);
    setPreviews([]);
    setDeletedAttachmentIds([]);

    if (fileInputRef.current) fileInputRef.current.value = "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, warranty.id]);

  // Revoke previews on unmount
  useEffect(() => {
    return () => {
      previews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [previews]);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function onFiles(list: FileList | null) {
    if (!list) return;

    previews.forEach((u) => URL.revokeObjectURL(u));

    const arr = Array.from(list);
    setFiles(arr);
    setPreviews(arr.map((f) => URL.createObjectURL(f)));
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index]);
    setFiles((f) => f.filter((_, i) => i !== index));
    setPreviews((p) => p.filter((_, i) => i !== index));

    // reset input if emptied (so selecting the same file again works)
    if (files.length === 1 && fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeExistingAttachment(id: string) {
    setDeletedAttachmentIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!form.item.trim()) {
      setFormError("Item name is required.");
      return;
    }

    setSaving(true);
    try {
      // Update core fields
      const res = await fetch(`/api/home/${homeId}/warranties/${warranty.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: form.item.trim(),
          provider: form.provider.trim() || null,
          policyNo: form.policyNo.trim() || null,
          expiresAt: form.expiresAt || null,
          note: form.note.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to update warranty");
      }

      // Delete selected attachments (only those user could remove are shown in "Your attachments",
      // but we just delete whatever’s in deletedAttachmentIds)
      for (const id of deletedAttachmentIds) {
        const del = await fetch(`/api/home/${homeId}/attachments/${id}`, { method: "DELETE" });
        if (!del.ok) {
          // non-fatal, but visible
          push("Some attachments could not be removed.");
        }
      }

      // Upload new files
      if (files.length > 0) {
        const uploaded: UploadedAttachment[] = [];

        for (const file of files) {
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
            const data = await presignRes.json().catch(() => null);
            throw new Error(data?.error || "Failed to start upload");
          }

          const presigned = await presignRes.json();

          const putRes = await fetch(presigned.url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type || "application/octet-stream" },
          });

          if (!putRes.ok) throw new Error("Upload failed");

          uploaded.push({
            storageKey: presigned.key,
            url: presigned.publicUrl || "",
            filename: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            visibility: "OWNER",
          });
        }

        const attachRes = await fetch(`/api/home/${homeId}/warranties/${warranty.id}/attachments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(uploaded),
        });

        if (!attachRes.ok) {
          const data = await attachRes.json().catch(() => null);
          throw new Error(data?.error || "Failed to save attachments");
        }
      }

      push("Warranty updated successfully", "success");
      onClose();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update warranty.";
      setFormError(msg);
      push("Failed to update warranty");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={onClose} title="Edit Warranty">
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className={`text-sm ${textMeta}`}>Update warranty details.</p>

        {formError ? (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-3 text-sm text-red-100">
            {formError}
          </div>
        ) : null}

        {/* Item */}
        <label className="block">
          <span className={formLabelCaps}>
            Item <span className="text-white/60">*</span>
          </span>
          <div className={formFieldShell}>
            <input
              className={formInputInner}
              value={form.item}
              onChange={(e) => set("item", e.target.value)}
              placeholder="e.g., HVAC System"
              required
            />
          </div>
        </label>

        {/* Provider / Policy */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={formLabelCaps}>Provider</span>
            <div className={formFieldShell}>
              <input
                className={formInputInner}
                value={form.provider}
                onChange={(e) => set("provider", e.target.value)}
                placeholder="e.g., Carrier"
              />
            </div>
          </label>

          <label className="block">
            <span className={formLabelCaps}>Policy Number</span>
            <div className={formFieldShell}>
              <input
                className={formInputInner}
                value={form.policyNo}
                onChange={(e) => set("policyNo", e.target.value)}
                placeholder="e.g., WAR-12345"
              />
            </div>
          </label>
        </div>

        {/* Expiration */}
        <label className="block">
          <span className={formLabelCaps}>Expiration Date</span>
          <div className={formFieldShell}>
            <input
              type="date"
              className={formInputInner}
              value={form.expiresAt}
              onChange={(e) => set("expiresAt", e.target.value)}
            />
          </div>
          <div className={formHelperText}>Leave blank if there is no expiration date.</div>
        </label>

        {/* Notes */}
        <label className="block">
          <span className={formLabelCaps}>Notes</span>
          <div className={formFieldShell}>
            <textarea
              rows={4}
              className={formTextareaInner}
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              placeholder="Coverage details, serial numbers, etc."
            />
          </div>
        </label>

        {/* Contractor attachments (read-only) */}
        {contractorAttachments.length > 0 ? (
          <div className="space-y-2">
            <div className={formLabelCaps}>Contractor attachments</div>

            <div className="space-y-2">
              {contractorAttachments.map((att) => {
                const kb = att.size == null ? null : (Number(att.size) / 1024).toFixed(1);
                const href = `/api/home/${homeId}/attachments/${att.id}`;

                return (
                  <a
                    key={att.id}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition-colors hover:bg-black/25"
                    title={att.filename}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                      <span className="text-lg">{att.mimeType?.includes("pdf") ? "📄" : "📎"}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">{att.filename}</div>
                      <div className="text-xs text-white/60">
                        {att.mimeType ?? "Attachment"}
                        {kb ? ` • ${kb} KB` : ""}
                      </div>
                    </div>

                    <span className="text-xs text-white/60">Open</span>
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* Your attachments (removable) */}
        {myAttachments.length > 0 ? (
          <div className="space-y-2">
            <div className={formLabelCaps}>Your attachments</div>

            <div className="space-y-2">
              {myAttachments.map((att) => {
                const kb = att.size == null ? null : (Number(att.size) / 1024).toFixed(1);
                const href = `/api/home/${homeId}/attachments/${att.id}`;

                return (
                  <div
                    key={att.id}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3"
                  >
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1"
                      title={att.filename}
                    >
                      <div className="truncate text-sm font-medium text-white">{att.filename}</div>
                      <div className="text-xs text-white/60">
                        {att.mimeType ?? "Attachment"}
                        {kb ? ` • ${kb} KB` : ""}
                      </div>
                    </a>

                    <button
                      type="button"
                      onClick={() => removeExistingAttachment(att.id)}
                      disabled={saving}
                      className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition-colors hover:bg-red-400/15 disabled:opacity-60"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {/* New attachments */}
        <div className="space-y-2">
          <div className={formLabelCaps}>Add attachments</div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf"
            onChange={(e) => onFiles(e.target.files)}
            className="sr-only"
          />

          <button
            type="button"
            className={formQuietButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={saving}
          >
            + Choose files
          </button>

          {previews.length > 0 ? (
            <div className={formSectionSurface}>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                New attachments ({previews.length})
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((url, i) => (
                  <div key={url} className="relative flex-shrink-0">
                    <Image
                      src={url}
                      alt={`Preview ${i + 1}`}
                      width={80}
                      height={80}
                      className="h-20 w-20 rounded-2xl border border-white/10 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      disabled={saving}
                      className="absolute -right-1 -top-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-red-400/30 bg-red-500/20 text-sm font-semibold text-red-100 hover:bg-red-500/30 disabled:opacity-60"
                      aria-label="Remove file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4">
          <GhostButton type="button" onClick={onClose} disabled={saving}>
            Cancel
          </GhostButton>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}