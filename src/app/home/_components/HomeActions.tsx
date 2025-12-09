// app/home/[homeId]/_components/HomeActions.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ctaPrimary, ctaGhost } from "@/lib/glass";
import {
  AddRecordModal,
  type UnifiedRecordPayload,
} from "@/app/home/_components/AddRecordModal";

type HomeActionsProps = {
  homeId: string;
  homeAddress: string; // unused but kept for compatibility
  unreadMessages?: number; // optional now – we also fetch client-side
};

type UnreadResponse = {
  total?: number;
  count?: number;
  unread?: number;
};

async function fetchUnreadMessages(homeId: string): Promise<number> {
  try {
    const res = await fetch(`/api/home/${homeId}/messages/unread`, {
      cache: "no-store",
    });
    if (!res.ok) return 0;

    let data: UnreadResponse = {};
    try {
      data = (await res.json()) as UnreadResponse;
    } catch {
      data = {};
    }

    return data.total ?? data.count ?? data.unread ?? 0;
  } catch (error) {
    console.error("Failed to fetch unread messages", error);
    return 0;
  }
}

export function HomeActions({
  homeId,
  homeAddress, // eslint will ignore unused if you have that rule off; safe to keep
  unreadMessages,
}: HomeActionsProps) {
  const router = useRouter();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(
    unreadMessages ?? 0
  );

  // If server ever passes a non-zero unreadMessages, sync once
  useEffect(() => {
    if (typeof unreadMessages === "number") {
      setUnreadCount(unreadMessages);
    }
  }, [unreadMessages]);

  // Always refresh unread count on mount / homeId change
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const count = await fetchUnreadMessages(homeId);
      if (!cancelled) {
        setUnreadCount(count);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [homeId]);

  async function handleCreate({
    payload,
    files,
  }: {
    payload: UnifiedRecordPayload;
    files: File[];
  }) {
    let endpoint = "";
    let body: Record<string, unknown> = {};

    if (payload.type === "record") {
      endpoint = `/api/home/${homeId}/records`;
      body = {
        title: payload.title,
        note: payload.note,
        date: payload.date,
        kind: payload.kind,
        vendor: payload.vendor,
        cost: payload.cost,
      };
    } else if (payload.type === "reminder") {
      endpoint = `/api/home/${homeId}/reminders`;
      body = {
        title: payload.title,
        dueAt: payload.dueAt,
        note: payload.note,
      };
    } else if (payload.type === "warranty") {
      endpoint = `/api/home/${homeId}/warranties`;
      body = {
        item: payload.item,
        provider: payload.provider,
        expiresAt: payload.expiresAt,
        note: payload.note,
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error("Failed to create");
    }

    const data: { id?: string } = await res.json();

    if (files.length > 0 && data.id) {
      for (const file of files) {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            homeId,
            filename: file.name,
            contentType: file.type,
            size: file.size,
            recordId: payload.type === "record" ? data.id : undefined,
            reminderId: payload.type === "reminder" ? data.id : undefined,
            warrantyId: payload.type === "warranty" ? data.id : undefined,
          }),
        });

        if (!presignRes.ok) continue;

        type PresignPayload = {
          url: string;
          key: string;
          publicUrl: string | null;
        };

        const { url, key, publicUrl } =
          (await presignRes.json()) as PresignPayload;

        await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        const attachEndpoint =
          payload.type === "record"
            ? `/api/home/${homeId}/records/${data.id}/attachments`
            : payload.type === "reminder"
            ? `/api/home/${homeId}/reminders/${data.id}/attachments`
            : `/api/home/${homeId}/warranties/${data.id}/attachments`;

        await fetch(attachEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify([
            {
              filename: file.name,
              size: file.size,
              contentType: file.type || "application/octet-stream",
              storageKey: key,
              url: publicUrl,
              visibility: "OWNER" as const,
            },
          ]),
        });
      }
    }

    setAddModalOpen(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-wrap gap-3 pt-2">
        {/* Primary: Add Record */}
        <button
          onClick={() => setAddModalOpen(true)}
          className={`${ctaPrimary} text-sm`}
        >
          + Add Record
        </button>

        {/* Messages */}
        <Link
          href={`/home/${homeId}/messages`}
          className={`${ctaGhost} relative text-sm`}
        >
          💬 Messages
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Request Service → list page */}
        <Link
          href={`/home/${homeId}/completed-service-submissions`}
          className={`${ctaGhost} text-sm`}
        >
          🔧 Request Service
        </Link>

        {/* Invite Pro → invitations list page */}
        <Link
          href={`/home/${homeId}/invitations`}
          className={`${ctaGhost} text-sm`}
        >
          ✉️ Invite Pro
        </Link>
      </div>

      <AddRecordModal
        open={addModalOpen}
        onCloseAction={() => setAddModalOpen(false)}
        onCreateAction={handleCreate}
      />
    </>
  );
}