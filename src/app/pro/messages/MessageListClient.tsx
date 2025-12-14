/**
 * MESSAGES LIST CLIENT COMPONENT
 *
 * Client component that polls for message updates.
 * Shows conversations with live unread counts.
 * Supports Active/Archived toggle for disconnected homeowners.
 *
 * Location: app/(pro)/pro/messages/MessageListClient.tsx
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { glassTight, textMeta } from "@/lib/glass";

type Conversation = {
  connectionId: string;
  homeowner: {
    name: string;
    image: string | null;
  };
  property: {
    address: string;
    city: string | null;
    state: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string | Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
  isArchived: boolean;
  archivedAt: Date | null;
};

const pillBase =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition";
const pillOn = "border-white/35 bg-white/15 text-white";
const pillOff = "border-white/20 bg-white/5 text-white/70 hover:bg-white/10";

export function MessageListClient({
  activeConversations: initialActive,
  archivedConversations: initialArchived,
}: {
  activeConversations: Conversation[];
  archivedConversations: Conversation[];
}) {
  const [view, setView] = useState<"active" | "archived">("active");
  const [activeConversations, setActiveConversations] = useState(initialActive);
  const [archivedConversations] = useState(initialArchived);

  const conversations = view === "active" ? activeConversations : archivedConversations;

  const hasArchived = archivedConversations.length > 0;

  // Poll only for active
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch("/api/messages/conversations");
        if (!response.ok) return;
        const data = await response.json();
        const active = (data.conversations || []).filter((c: Conversation) => !c.isArchived);
        setActiveConversations(active);
      } catch (error) {
        console.error("Failed to fetch message updates:", error);
      }
    };

    const interval = window.setInterval(fetchUpdates, 10000);
    return () => window.clearInterval(interval);
  }, []);

  const emptyCopy = useMemo(() => {
    if (view === "active") {
      return {
        title: "No active conversations",
        body:
          "Messages will appear here when homeowners reach out or when you start a conversation with a connected homeowner.",
      };
    }
    return {
      title: "No archived conversations",
      body: "Conversations with homeowners who have disconnected will appear here.",
    };
  }, [view]);

  return (
    <>
      {/* Toggle pills (match our style) */}
      {hasArchived && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setView("active")}
            className={[pillBase, view === "active" ? pillOn : pillOff].join(" ")}
          >
            Active ({activeConversations.length})
          </button>
          <button
            type="button"
            onClick={() => setView("archived")}
            className={[pillBase, view === "archived" ? pillOn : pillOff].join(" ")}
          >
            Archived ({archivedConversations.length})
          </button>
        </div>
      )}

      {/* List */}
      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
          <p className="mb-2 text-white/80">{emptyCopy.title}</p>
          <p className={`text-sm ${textMeta}`}>{emptyCopy.body}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const addressLine = [conv.property.address, conv.property.city, conv.property.state]
              .filter(Boolean)
              .join(", ");

            const lastAt = conv.lastMessage?.createdAt
              ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })
              : null;

            const showUnread = !conv.isArchived && conv.unreadCount > 0;

            return (
              <Link
                key={conv.connectionId}
                href={`/pro/messages/${conv.connectionId}`}
                className={[
                  glassTight,
                  "group flex items-center gap-4 transition-colors hover:bg-white/10",
                  conv.isArchived ? "opacity-80" : "",
                ].join(" ")}
              >
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {conv.homeowner.image ? (
                    <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/10">
                      <Image
                        src={conv.homeowner.image}
                        alt={conv.homeowner.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full border border-white/10 bg-white/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-white/90">
                        {conv.homeowner.name[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-center gap-2">
                      <p className="truncate font-semibold text-white">
                        {conv.homeowner.name}
                      </p>

                      {conv.isArchived && (
                        <span className="flex-shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                          Archived
                        </span>
                      )}
                    </div>

                    {lastAt && (
                      <p className={`flex-shrink-0 text-xs ${textMeta}`}>
                        {lastAt}
                      </p>
                    )}
                  </div>

                  {addressLine && (
                    <p className={`text-sm ${textMeta} truncate`}>{addressLine}</p>
                  )}

                  {conv.lastMessage ? (
                    <p
                      className={[
                        "mt-1 truncate text-sm",
                        showUnread ? "text-white font-medium" : "text-white/70",
                      ].join(" ")}
                    >
                      {conv.lastMessage.content}
                    </p>
                  ) : (
                    <p className={`mt-1 text-sm ${textMeta}`}>No messages yet.</p>
                  )}

                  {conv.isArchived && conv.archivedAt && (
                    <p className={`mt-1 text-xs ${textMeta}`}>
                      Disconnected{" "}
                      {formatDistanceToNow(new Date(conv.archivedAt), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {/* Right side */}
                <div className="flex-shrink-0 flex items-center gap-3">
                  {showUnread && (
                    <div className="h-6 min-w-[24px] px-2 rounded-full bg-orange-500/90 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                      </span>
                    </div>
                  )}

                  {conv.isArchived && (
                    <div className="text-white/35">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}