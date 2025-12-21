"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { glassTight, textMeta } from "@/lib/glass";

type Conversation = {
  connectionId: string;
  contractor: {
    name: string;
    image: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
  isArchived: boolean;
  archivedAt: Date | null;
};

export function MessagesListClient({
  homeId,
  activeConversations,
  archivedConversations,
}: {
  homeId: string;
  activeConversations: Conversation[];
  archivedConversations: Conversation[];
}) {
  const [view, setView] = useState<"active" | "archived">("active");

  const conversations = view === "active" ? activeConversations : archivedConversations;

  const hasArchived = archivedConversations.length > 0;

  return (
    <>
      {/* Tabs (landing-style segmented toggle) */}
      {hasArchived && (
        <div className="mb-4 inline-flex overflow-hidden rounded-full border border-white/20 bg-white/5 p-0.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setView("active")}
            className={[
              "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
              view === "active"
                ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
                : "text-white/80 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            Active{activeConversations.length > 0 ? ` (${activeConversations.length})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setView("archived")}
            className={[
              "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
              view === "archived"
                ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
                : "text-white/80 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            Archived{archivedConversations.length > 0 ? ` (${archivedConversations.length})` : ""}
          </button>
        </div>
      )}

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          {view === "active" ? (
            <>
              <p className="mb-2 text-white/80">No active conversations</p>
              <p className={`text-sm ${textMeta}`}>
                Messages will appear here when contractors reach out or when you start a conversation with a connected
                contractor.
              </p>
            </>
          ) : (
            <>
              <p className="mb-2 text-white/80">No archived conversations</p>
              <p className={`text-sm ${textMeta}`}>Conversations with disconnected contractors will appear here.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link
              key={conv.connectionId}
              href={`/home/${homeId}/messages/${conv.connectionId}`}
              className={[
                glassTight,
                "flex items-center gap-4 transition-colors",
                "hover:bg-white/10",
                conv.isArchived ? "opacity-75" : "",
              ].join(" ")}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {conv.contractor.image ? (
                  <Image
                    src={conv.contractor.image}
                    alt={conv.contractor.name}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full border border-white/10 object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/20">
                    <span className="text-xl font-medium">{conv.contractor.name[0]?.toUpperCase() || "?"}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate font-medium text-white">{conv.contractor.name}</p>

                    {conv.isArchived && (
                      <span className="flex-shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/60">
                        Archived
                      </span>
                    )}
                  </div>

                  {conv.lastMessage && (
                    <p className={`flex-shrink-0 text-xs ${textMeta}`}>
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })}
                    </p>
                  )}
                </div>

                {conv.lastMessage ? (
                  <p
                    className={[
                      "mt-1 truncate text-sm",
                      conv.unreadCount > 0 && !conv.isArchived ? "font-medium text-white" : textMeta,
                    ].join(" ")}
                  >
                    {conv.lastMessage.content}
                  </p>
                ) : (
                  <p className={`mt-1 truncate text-sm ${textMeta}`}>No messages yet</p>
                )}

                {conv.isArchived && conv.archivedAt && (
                  <p className="mt-1 text-xs text-white/40">
                    Disconnected {formatDistanceToNow(new Date(conv.archivedAt), { addSuffix: true })}
                  </p>
                )}
              </div>

              {/* Unread badge - only for active conversations */}
              {!conv.isArchived && conv.unreadCount > 0 && (
                <div className="flex h-6 min-w-[24px] flex-shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5">
                  <span className="text-xs font-bold text-white">{conv.unreadCount > 99 ? "99+" : conv.unreadCount}</span>
                </div>
              )}

              {/* Archived indicator */}
              {conv.isArchived && (
                <div className="flex-shrink-0 text-white/35">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                    />
                  </svg>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </>
  );
}