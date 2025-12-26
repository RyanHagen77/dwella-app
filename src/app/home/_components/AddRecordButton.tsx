"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaPrimary } from "@/lib/glass";
import { useToast } from "@/components/ui/Toast";
import { AddRecordModal, type UnifiedRecordPayload } from "@/app/home/_components/AddRecordModal";

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

export function AddRecordButton({
  homeId,
  label = "+ Add Record",
  defaultType = "record",
  variant = "button",
  className,
}: {
  homeId: string;
  label?: string;
  defaultType?: "record" | "reminder" | "warranty";
  variant?: "button" | "link";
  className?: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [addOpen, setAddOpen] = useState(false);

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
        const errorText = await pre.text().catch(() => "");
        throw new Error(`Presign failed: ${errorText || pre.statusText}`);
      }

      const { key, url, publicUrl } = (await pre.json()) as PresignResponse;
      if (!key || !url) throw new Error("Presign missing key/url");

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": f.type || "application/octet-stream" },
        body: f,
      });

      if (!put.ok) {
        const txt = await put.text().catch(() => "");
        throw new Error(`Upload failed: ${txt || put.statusText}`);
      }

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

    if (!persist.ok) {
      const txt = await persist.text().catch(() => "");
      throw new Error(`Persist attachments failed: ${txt || persist.statusText}`);
    }
  }

  async function createRecord(payload: {
    title: string;
    note?: string | null;
    date?: string;
    kind?: string | null;
    vendor?: string | null;
    cost?: number | null;
    verified?: boolean | null;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !json?.id) throw new Error(json?.error || "Failed to create record");
    return { id: json.id };
  }

  async function createReminder(payload: {
    title: string;
    dueAt: string;
    note?: string | null;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/reminders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !json?.id) throw new Error(json?.error || "Failed to create reminder");
    return { id: json.id };
  }

  async function createWarranty(payload: {
    item: string;
    provider?: string | null;
    expiresAt?: string | null;
    note?: string | null;
  }): Promise<{ id: string }> {
    const res = await fetch(`/api/home/${homeId}/warranties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !json?.id) throw new Error(json?.error || "Failed to create warranty");
    return { id: json.id };
  }

  async function onCreateUnified({ payload, files }: { payload: UnifiedRecordPayload; files: File[] }) {
    try {
      if (payload.type === "record") {
        const record = await createRecord({
          title: payload.title,
          note: payload.note ?? undefined,
          date: payload.date ?? undefined,
          kind: payload.kind ?? undefined,
          vendor: payload.vendor ?? undefined,
          cost: payload.cost,
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
        // ✅ DO NOT reference fields your UnifiedRecordPayload doesn't define (e.g., policyNo)
        const warranty = await createWarranty({
          item: payload.item!,
          provider: payload.provider ?? undefined,
          expiresAt: payload.expiresAt ?? undefined,
          note: payload.note ?? undefined,
        });

        await uploadAndPersistAttachments({ homeId, warrantyId: warranty.id, files });
      }

      setAddOpen(false);
      router.refresh();
      push("Saved.");
    } catch (err) {
      console.error(err);
      push(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  /**
   * ✅ Standard “indigo link” (NO border/slab, NO padding, text-base)
   * Works even if a parent wrapper tries to style buttons.
   */
  const linkClasses =
    "inline-flex items-center " +
    "!bg-transparent !border-0 !shadow-none !ring-0 !outline-none " +
    "!p-0 !rounded-none " +
    "!text-base !font-medium !text-indigo-300 hover:!text-indigo-200";

  return (
    <>
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        className={[variant === "link" ? linkClasses : ctaPrimary, className ?? ""].join(" ")}
      >
        {label}
      </button>

      <AddRecordModal
        open={addOpen}
        onCloseAction={() => setAddOpen(false)}
        onCreateAction={onCreateUnified}
        defaultType={defaultType}
      />
    </>
  );
}

export default AddRecordButton;