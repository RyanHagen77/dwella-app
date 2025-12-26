// app/home/[homeId]/_components/HomeActions.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { AddRecordModal, type UnifiedRecordPayload } from "@/app/home/_components/AddRecordModal";

type HomeActionsProps = {
  homeId: string;
  homeAddress?: string;
  unreadMessages?: number;
};

type UnreadResponse = {
  total?: number;
  count?: number;
  unread?: number;
};

async function fetchUnreadMessages(homeId: string): Promise<number> {
  try {
    const res = await fetch(`/api/home/${homeId}/messages/unread`, { cache: "no-store" });
    if (!res.ok) return 0;
    const data = (await res.json().catch(() => ({}))) as UnreadResponse;
    return data.total ?? data.count ?? data.unread ?? 0;
  } catch (error) {
    console.error("Failed to fetch unread messages", error);
    return 0;
  }
}

type PresignPayload = {
  url: string;
  key: string;
  publicUrl: string | null;
};

type PersistAttachment = {
  filename: string;
  size: number;
  contentType: string;
  storageKey: string;
  url: string;
  visibility: "OWNER" | "HOME" | "PUBLIC";
  notes?: string;
};

export function HomeActions({ homeId, unreadMessages }: HomeActionsProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(unreadMessages ?? 0);

  useEffect(() => {
    if (typeof unreadMessages === "number") setUnreadCount(unreadMessages);
  }, [unreadMessages]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const count = await fetchUnreadMessages(homeId);
      if (!cancelled) setUnreadCount(count);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [homeId]);

  async function uploadAndPersistAttachments(args: {
    homeId: string;
    recordId?: string;
    reminderId?: string;
    warrantyId?: string;
    files: File[];
  }) {
    const { files } = args;
    if (!files.length) return;

    const uploaded: PersistAttachment[] = [];

    for (const file of files) {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId: args.homeId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          recordId: args.recordId,
          reminderId: args.reminderId,
          warrantyId: args.warrantyId,
        }),
      });

      if (!presignRes.ok) continue;

      const { url, key, publicUrl } = (await presignRes.json()) as PresignPayload;

      const put = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!put.ok) continue;

      uploaded.push({
        filename: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
        storageKey: key,
        url: publicUrl ?? "",
        visibility: "OWNER",
      });
    }

    if (!uploaded.length) return;

    let attachEndpoint = "";
    if (args.recordId) attachEndpoint = `/api/home/${homeId}/records/${args.recordId}/attachments`;
    else if (args.reminderId) attachEndpoint = `/api/home/${homeId}/reminders/${args.reminderId}/attachments`;
    else if (args.warrantyId) attachEndpoint = `/api/home/${homeId}/warranties/${args.warrantyId}/attachments`;
    if (!attachEndpoint) return;

    const persist = await fetch(attachEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploaded),
    });

    if (!persist.ok) {
      console.warn("Persist attachments failed:", await persist.text().catch(() => ""));
    }
  }

  async function handleCreateAction({ payload, files }: { payload: UnifiedRecordPayload; files: File[] }) {
    let endpoint = "";
    let body: Record<string, unknown> = {};

    if (payload.type === "record") {
      endpoint = `/api/home/${homeId}/records`;
      body = {
        title: payload.title,
        note: payload.note ?? null,
        date: payload.date ?? null,
        kind: payload.kind ?? null,
        vendor: payload.vendor ?? null,
        cost: payload.cost ?? null,
        verified: payload.verified ?? null,
      };
    } else if (payload.type === "reminder") {
      endpoint = `/api/home/${homeId}/reminders`;
      body = {
        title: payload.title,
        dueAt: payload.dueAt ?? null,
        note: payload.note ?? null,
      };
    } else {
      endpoint = `/api/home/${homeId}/warranties`;
      body = {
        item: payload.item ?? null,
        provider: payload.provider ?? null,
        expiresAt: payload.expiresAt ?? null,
        purchasedAt: payload.purchasedAt ?? null,
        note: payload.note ?? null,
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
    if (!res.ok || !data.id) throw new Error(data.error || "Failed to create");

    if (files.length) {
      await uploadAndPersistAttachments({
        homeId,
        files,
        recordId: payload.type === "record" ? data.id : undefined,
        reminderId: payload.type === "reminder" ? data.id : undefined,
        warrantyId: payload.type === "warranty" ? data.id : undefined,
      });
    }

    setAddModalOpen(false);
    router.refresh();
  }

  // ✅ Indigo *pill* (NOT a link). Force size + remove any “tiny” defaults.
  const indigoPill =
    `${ctaGhost} ` +
    "!text-sm !font-medium " +
    "!bg-white/5 hover:!bg-white/10 " +
    "!border-white/20 hover:!border-white/30 " +
    "!text-indigo-200 hover:!text-indigo-100 " +
    "!shadow-none";

  return (
    <>
      <div className="flex flex-wrap gap-3 pt-2">
        <button type="button" onClick={() => setAddModalOpen(true)} className={indigoPill}>
          + Add record
        </button>

        <Link href={`/home/${homeId}/messages`} className={`${ctaGhost} relative !text-sm`}>
          💬 Messages
          {unreadCount > 0 ? (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          ) : null}
        </Link>

        <Link href={`/home/${homeId}/completed-service-submissions`} className={`${ctaGhost} !text-sm`}>
          🔧 Request Service
        </Link>

        <Link href={`/home/${homeId}/invitations`} className={`${ctaGhost} !text-sm`}>
          ✉️ Invite a pro
        </Link>
      </div>

      <AddRecordModal
        open={addModalOpen}
        onCloseAction={() => setAddModalOpen(false)}
        onCreateAction={handleCreateAction}
      />
    </>
  );
}