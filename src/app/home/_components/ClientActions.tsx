// app/home/_components/ClientActions.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ctaPrimary, ctaGhost } from "@/lib/glass";

/** Client modals */
import {
  AddRecordModal,
  type UnifiedRecordPayload,
} from "@/app/home/_components/AddRecordModal";
import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";
import {
  FindVendorsModal,
  type VendorDirectoryItem,
} from "@/app/home/_components/FindVendorModal";
import { ConnectionsModal } from "@/app/home/_components/ConnectionsModal";

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

type InvitationResponse = {
  sentInvitations?: { status: string }[];
  receivedInvitations?: { status: string }[];
};

/* ---------- Component ---------- */
export default function ClientActions({ homeId }: { homeId: string }) {
  const router = useRouter();

  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [findVendorsOpen, setFindVendorsOpen] = useState(false);
  const [connectionsOpen, setConnectionsOpen] = useState(false);

  const [pendingWorkCount, setPendingWorkCount] = useState(0);
  const [loadingPending, setLoadingPending] = useState(true);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

useEffect(() => {
  async function fetchPendingWork() {
    try {
      const res = await fetch(`/api/home/${homeId}/completed-work-submissions/pending`);
      if (!res.ok) {
        setPendingWorkCount(0);
        return;
      }

      const data = await res.json();
      // Changed from data.totalPending to data.total
      const count = data.total || 0;

      setPendingWorkCount(count);
    } catch (error) {
      console.error("Error fetching pending document-completed-work-submissions:", error);
      setPendingWorkCount(0);
    } finally {
      setLoadingPending(false);
    }
  }

  void fetchPendingWork();
}, [homeId]);

  /* ---------- Fetch pending invitations count ---------- */
  useEffect(() => {
    async function fetchPendingInvitations() {
      try {
        const res = await fetch(`/api/home/${homeId}/invitations?status=PENDING`);
        if (res.ok) {
          const data = (await res.json()) as InvitationResponse;
          const sentCount = data.sentInvitations?.filter((inv) => inv.status === 'PENDING').length || 0;
          const receivedCount = data.receivedInvitations?.filter((inv) => inv.status === 'PENDING').length || 0;
          setPendingInvitationsCount(sentCount + receivedCount);
        }
      } catch (error) {
        console.error("Error fetching pending invitations:", error);
      } finally {
        setLoadingInvitations(false);
      }
    }

    void fetchPendingInvitations();
  }, [homeId]);

  /* ---------- Fetch unread messages count for THIS home ---------- */
  useEffect(() => {
    async function fetchUnreadMessages() {
      try {
        const res = await fetch(`/api/home/${homeId}/messages/unread`);
        if (res.ok) {
          const data = await res.json();
          setUnreadMessagesCount(data.total || 0);
        }
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    }

    void fetchUnreadMessages();
  }, [homeId]);

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
    if (!res.ok || !json?.id)
      throw new Error(json?.error || "Failed to create record");
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
    if (!res.ok || !json?.id)
      throw new Error(json?.error || "Failed to create reminder");
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
    if (!res.ok || !json?.id)
      throw new Error(json?.error || "Failed to create warranty");
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
      if (!put.ok)
        throw new Error(`S3 PUT failed: ${await put.text().catch(() => "")}`);

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
    if (recordId)
      endpoint = `/api/home/${homeId}/records/${recordId}/attachments`;
    else if (warrantyId)
      endpoint = `/api/home/${homeId}/warranties/${warrantyId}/attachments`;
    else if (reminderId)
      endpoint = `/api/home/${homeId}/reminders/${reminderId}/attachments`;
    if (!endpoint) return;

    const persist = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploaded),
    });
    if (!persist.ok)
      throw new Error(
        `Persist attachments failed: ${await persist.text()}`
      );
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
      await uploadAndPersistAttachments({
        homeId,
        reminderId: reminder.id,
        files,
      });
    } else if (payload.type === "warranty") {
      const warranty = await createWarranty({
        item: payload.item!,
        provider: payload.provider ?? undefined,
        policyNo: undefined,
        expiresAt: payload.expiresAt ?? undefined,
        note: payload.note ?? undefined,
      });
      await uploadAndPersistAttachments({
        homeId,
        warrantyId: warranty.id,
        files,
      });
    }

    setAddOpen(false);
    router.refresh();
  }

  /* ---------- UI ---------- */
  return (
    <>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <button onClick={() => setAddOpen(true)} className={`${ctaPrimary} whitespace-nowrap text-sm`}>
          + Add Record
        </button>

        {/* Messages Button - shows count for THIS home only */}
        <Link
          href={`/home/${homeId}/messages`}
          className={`${ctaGhost} relative whitespace-nowrap text-sm`}
        >
          Messages
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {unreadMessagesCount}
            </span>
          )}
        </Link>

        {/* Connections Button - invitations + document-completed-work-submissions with separate badges */}
        <button
          type="button"
          onClick={() => setConnectionsOpen(true)}
          className={`${ctaGhost} relative whitespace-nowrap text-sm w-full sm:w-auto`}
        >
          <span className="hidden sm:inline">Connect</span>
          <span className="inline sm:hidden">Connect</span>
          {(pendingInvitationsCount > 0 || pendingWorkCount > 0) && (
            <span className="ml-1.5 inline-flex items-center gap-1">
              {pendingInvitationsCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                  {pendingInvitationsCount}
                </span>
              )}
              {pendingWorkCount > 0 && (
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#33C17D] px-1.5 text-xs font-bold text-white">
                  {pendingWorkCount}
                </span>
              )}
            </span>
          )}
        </button>
      </div>

    {/* Unified Add Modal */}
    <AddRecordModal
      open={addOpen}
      onCloseAction={() => setAddOpen(false)}
      onCreateAction={onCreateUnified}
    />

    {/* Share Access */}
    <ShareAccessModal
      open={shareOpen}
      onCloseAction={() => setShareOpen(false)}
      homeId={homeId}
    />

    {/* Find Vendors */}
    <FindVendorsModal
      open={findVendorsOpen}
      onCloseAction={() => setFindVendorsOpen(false)}
      onAdd={(v: VendorDirectoryItem) => {
        console.log("picked vendor", v.id);
      }}
    />

    {/* Connections Modal */}
    <ConnectionsModal
      open={connectionsOpen}
      onCloseAction={() => setConnectionsOpen(false)}
      homeId={homeId}
      pendingWorkCount={pendingWorkCount}
      loadingWork={loadingPending}
      pendingInvitationsCount={pendingInvitationsCount}
      loadingInvites={loadingInvitations}
      onOpenShareAction={() => {
        setConnectionsOpen(false);
        setShareOpen(true);
      }}
      onOpenVendorsAction={() => {
        setConnectionsOpen(false);
        setFindVendorsOpen(true);
      }}
    />
  </>
);
}