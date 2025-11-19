/**
 * MESSAGES LIST CLIENT COMPONENT
 *
 * Client component that polls for message updates.
 * Shows conversations with live unread counts.
 *
 * Location: app/(pro)/pro/messages/_components/MessagesList.tsx
 */

"use client";

import { useState, useEffect } from "react";
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
    createdAt: Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
};

export function MessagesList({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch("/api/messages/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
        }
      } catch (error) {
        console.error("Failed to fetch message updates:", error);
      }
    };

    const interval = setInterval(fetchUpdates, 10000);
    return () => clearInterval(interval);
  }, []);

  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <p className="mb-2 text-white/80">No conversations yet</p>
        <p className={`text-sm ${textMeta}`}>
          Messages will appear here when homeowners reach out or when you
          start a conversation with a connected homeowner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conv) => (
        <Link
          key={conv.connectionId}
          href={`/pro/messages/${conv.connectionId}`}
          className={`${glassTight} flex items-center gap-4 hover:bg-white/10 transition-colors`}
        >
          {/* Avatar */}
          <div className="flex-shrink-0">
            {conv.homeowner.image ? (
              <Image
                src={conv.homeowner.image}
                alt={conv.homeowner.name}
                width={48}
                height={48}
                className="rounded-full"
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-xl font-medium">
                  {conv.homeowner.name[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="font-medium text-white truncate">
                {conv.homeowner.name}
              </p>
              {conv.lastMessage && (
                <p className={`text-xs ${textMeta} flex-shrink-0`}>
                  {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
            <p className={`text-sm ${textMeta} truncate`}>
              {conv.property.address}
              {conv.property.city && `, ${conv.property.city}`}
            </p>
            {conv.lastMessage && (
              <p
                className={`text-sm ${
                  conv.unreadCount > 0 ? "text-white font-medium" : textMeta
                } truncate mt-1`}
              >
                {conv.lastMessage.content}
              </p>
            )}
          </div>

          {/* Unread badge */}
          {conv.unreadCount > 0 && (
            <div className="flex-shrink-0 h-6 min-w-[24px] px-1.5 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </span>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}