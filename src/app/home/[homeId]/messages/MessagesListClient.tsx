"use client";

import {useState} from "react";
import Image from "next/image";
import Link from "next/link";
import {formatDistanceToNow} from "date-fns";
import {glassTight, textMeta} from "@/lib/glass";

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

  return (
    <>
      {/* Pills - only show if there are archived conversations */}
      {archivedConversations.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setView("active")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              view === "active"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Active ({activeConversations.length})
          </button>
          <button
            onClick={() => setView("archived")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              view === "archived"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Archived ({archivedConversations.length})
          </button>
        </div>
      )}

      {/* Conversations List */}
      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          {view === "active" ? (
            <>
              <p className="mb-2 text-white/80">No active conversations</p>
              <p className={`text-sm ${textMeta}`}>
                Messages will appear here when contractors reach out or when you
                start a conversation with a connected contractor.
              </p>
            </>
          ) : (
            <>
              <p className="mb-2 text-white/80">No archived conversations</p>
              <p className={`text-sm ${textMeta}`}>
                Conversations with disconnected contractors will appear here.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <Link
              key={conv.connectionId}
              href={`/home/${homeId}/messages/${conv.connectionId}`}
              className={`${glassTight} flex items-center gap-4 hover:bg-white/10 transition-colors ${
                conv.isArchived ? "opacity-75" : ""
              }`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0">
                {conv.contractor.image ? (
                  <Image
                    src={conv.contractor.image}
                    alt={conv.contractor.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xl font-medium">
                      {conv.contractor.name[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="font-medium text-white truncate">
                      {conv.contractor.name}
                    </p>
                    {conv.isArchived && (
                      <span className="inline-block rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400 flex-shrink-0">
                        Archived
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className={`text-xs ${textMeta} flex-shrink-0`}>
                      {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
                {conv.lastMessage && (
                  <p
                    className={`mt-1 truncate text-sm ${
                      conv.unreadCount > 0 && !conv.isArchived
                        ? "text-white font-medium"
                        : textMeta
                    }`}
                  >
                    {conv.lastMessage.content}
                  </p>
                )}
                {conv.isArchived && conv.archivedAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    Disconnected {formatDistanceToNow(new Date(conv.archivedAt), { addSuffix: true })}
                  </p>
                )}
              </div>

              {/* Unread badge - only for active conversations */}
              {!conv.isArchived && conv.unreadCount > 0 && (
                <div className="flex-shrink-0 h-6 min-w-[24px] px-1.5 rounded-full bg-orange-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">
                    {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                  </span>
                </div>
              )}

              {/* Read-only indicator for archived */}
              {conv.isArchived && (
                <div className="flex-shrink-0 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
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