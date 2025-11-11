"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaPrimary, ctaGhost } from "@/lib/glass";

/** Client modals */
import { AddRecordModal, type UnifiedRecordPayload } from "@/app/home/_components/AddRecordModal";
import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";
import { FindVendorsModal, type VendorDirectoryItem } from "@/app/home/_components/FindVendorModal";

/* ---------- Types ---------- */
type PresignResponse = { key: string; url: string; publicUrl: string | null };
type PersistAttachment = {
  filename: string;
  size: number;
  contentType: string;
  storageKey: string;
  url: string | null;
  visibility: "OWNER" | "HOME" | "PUBLIC";
  notes?: string;
};

/* ---------- Component ---------- */
export default function ClientActions({ homeId }: { homeId: string }) {
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [findVendorsOpen, setFindVendorsOpen] = useState(false);

  /* ---------- API Helpers ---------- */
  async function createRecord(payload: {
    title: string;
    note?: string | null | undefined;
    date?: string | undefined;
    kind?: string | null | undefined;
    vendor?: string | null | undefined;
    cost?: number | null | undefined;
    verified?: boolean | null | undefined;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id) throw new Error(json?.error || "Failed to create record");
    return { id: json.id };
  }

  async function createReminder(payload: {
    title: string;
    dueAt: string;
    note?: string | null | undefined;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id) throw new Error(json?.error || "Failed to create reminder");
    return { id: json.id };
  }

  async function createWarranty(payload: {
    item: string;
    provider?: string | null | undefined;
    policyNo?: string | null | undefined;
    expiresAt?: string | null | undefined;
    note?: string | null | undefined;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/warranties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.id) throw new Error(json?.error || "Failed to create warranty");
    return { id: json.id };
  }

  /* ---------- Shared uploader helper ---------- */
  async function uploadAndPersistAttachments({
    homeId,
    recordId,
    warrantyId,
    reminderId,
    files,
  }: {
    homeId: string;
    recordId?: string;
    warrantyId?: string;
    reminderId?: string;
    files: File[];
  }) {
    if (!files.length) return;

    const uploaded: PersistAttachment[] = [];
    for (const f of files) {
      // Build presign payload - only include the ID that's actually present
      const presignPayload: {
        homeId: string;
        filename: string;
        contentType: string;
        size: number;
        recordId?: string;
        warrantyId?: string;
        reminderId?: string;
      } = {
        homeId,
        filename: f.name,
        contentType: f.type || "application/octet-stream",
        size: f.size,
      };

      // Add whichever ID is present
      if (recordId) presignPayload.recordId = recordId;
      if (warrantyId) presignPayload.warrantyId = warrantyId;
      if (reminderId) presignPayload.reminderId = reminderId;

      const pre = await fetch(`/api/uploads/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(presignPayload),
      });

      if (!pre.ok) {
        const errorText = await pre.text();
        throw new Error(`Presign failed: ${errorText}`);
      }

      const { key, url, publicUrl } = (await pre.json()) as PresignResponse;
      if (!key || !url) throw new Error("Presign missing key/url");

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": f.type || "application/octet-stream" },
        body: f,
      });
      if (!put.ok) throw new Error(`S3 PUT failed: ${await put.text().catch(() => "")}`);

      uploaded.push({
        filename: f.name,
        size: f.size,
        contentType: f.type || "application/octet-stream",
        storageKey: key,
        url: publicUrl,
        visibility: "OWNER",
        notes: undefined,
      });
    }

    // Pick correct endpoint
    let endpoint = "";
    if (recordId) endpoint = `/api/home/${homeId}/records/${recordId}/attachments`;
    else if (warrantyId) endpoint = `/api/home/${homeId}/warranties/${warrantyId}/attachments`;
    else if (reminderId) endpoint = `/api/home/${homeId}/reminders/${reminderId}/attachments`;
    if (!endpoint) return;

    const persist = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploaded),
    });
    if (!persist.ok) throw new Error(`Persist attachments failed: ${await persist.text()}`);
  }

  /* ---------- Unified handler for all types ---------- */
  async function onCreateUnified({
    payload,
    files,
  }: {
    payload: UnifiedRecordPayload;
    files: File[];
  }) {
    if (payload.type === "record") {
      const record = await createRecord({
        title: payload.title,
        note: payload.note ?? undefined,
        date: payload.date ?? undefined,
        kind: payload.kind ?? undefined,
        vendor: payload.vendor ?? undefined,
        cost: typeof payload.cost === "number" ? payload.cost : undefined,
        verified: payload.verified ?? undefined,
      });
      await uploadAndPersistAttachments({ homeId, recordId: record.id, files });
    } else if (payload.type === "reminder") {
      const reminder = await createReminder({
        title: payload.title,
        dueAt: payload.dueAt!,
        note: payload.note ?? undefined,
      });
      await uploadAndPersistAttachments({ homeId, reminderId: reminder.id, files });
    } else if (payload.type === "warranty") {
      const warranty = await createWarranty({
        item: payload.item!,
        provider: payload.provider ?? undefined,
        policyNo: undefined,
        expiresAt: payload.expiresAt ?? undefined,
        note: payload.note ?? undefined,
      });
      await uploadAndPersistAttachments({ homeId, warrantyId: warranty.id, files });
    }

    setAddOpen(false);
    router.refresh();
  }

  /* ---------- UI ---------- */
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setAddOpen(true)} className={ctaPrimary}>
          + Add Record
        </button>
        <button onClick={() => setShareOpen(true)} className={ctaGhost}>
          Share Access
        </button>
        <a href={`/report?home=${homeId}`} className={ctaGhost}>
          View Report
        </a>
      </div>

      {/* Unified Add Modal */}
      <AddRecordModal
        open={addOpen}
        onCloseAction={() => setAddOpen(false)}
        onCreateAction={onCreateUnified}
      />

      {/* Share Access */}
      <ShareAccessModal open={shareOpen} onCloseAction={() => setShareOpen(false)} homeId={homeId} />

      {/* Find Vendors */}
      <FindVendorsModal
        open={findVendorsOpen}
        onCloseAction={() => setFindVendorsOpen(false)}
        onAdd={(v: VendorDirectoryItem) => {
          // hook up when ready
          console.log("picked vendor", v.id);
        }}
      />
    </>
  );
}