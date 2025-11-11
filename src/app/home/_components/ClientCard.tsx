"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { glass, ctaGhost, heading } from "@/lib/glass";
import { AddRecordModal, type UnifiedRecordPayload } from "./AddRecordModal";

type RecordType = "record" | "reminder" | "warranty";

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

export function ClientCard({
  title,
  children,
  viewAllLink,
  homeId,
  addType,
}: {
  title: string;
  children: React.ReactNode;
  viewAllLink?: string;
  homeId: string;
  addType?: RecordType;
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);

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

  return (
    <>
      <section className={glass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-medium ${heading}`}>{title}</h2>
          {addType && (
            <button
              onClick={() => setAddOpen(true)}
              className="text-sm text-white/70 hover:text-white transition-colors"
            >
              + Add
            </button>
          )}
        </div>
        {children}
        {viewAllLink && (
          <div className="mt-4 pt-3 border-t border-white/10 text-right">
            <Link href={viewAllLink} className={`${ctaGhost} text-sm`}>
              View All →
            </Link>
          </div>
        )}
      </section>

      {addType && (
        <AddRecordModal
          open={addOpen}
          onCloseAction={() => setAddOpen(false)}
          onCreateAction={onCreateUnified}
          defaultType={addType}
        />
      )}
    </>
  );
}