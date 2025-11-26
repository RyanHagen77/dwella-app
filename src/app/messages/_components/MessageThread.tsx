/**
 * MESSAGE THREAD COMPONENT
 *
 * Real-time messaging interface with Pusher subscriptions.
 * Works for ALL user types (homeowner, contractor, realtor, inspector).
 * Handles messages display, sending, and marking as read.
 *
 * Location: app/messages/_components/MessageThread.tsx
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    url: string;
  }>;
  reads: Array<{ userId: string }>;
};

type Props = {
  connectionId: string;
  initialMessages: Message[];
  currentUserId: string;
  otherUser: {
    id: string;
    name: string;
    image: string | null;
  };
  readOnly?: boolean;
};

export function MessageThread({
  connectionId,
  initialMessages,
  currentUserId,
  otherUser,
  readOnly = false,
}: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe to Pusher for real-time updates (only if not read-only)
  useEffect(() => {
    if (readOnly) return;

    const channel = pusherClient.subscribe(`connection-${connectionId}`);

    channel.bind("new-messages", (data: { message: Message }) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === data.message.id)) {
          return prev;
        }
        return [...prev, data.message];
      });
      scrollToBottom();
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [connectionId, readOnly]);

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch(`/api/messages/${connectionId}/read`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    };

    markAsRead();
  }, [connectionId, messages.length]);

  // Scroll to bottom on mount and new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <div className="mx-auto max-w-3xl space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-white/60 text-sm">
                  {readOnly
                    ? "No messages in this conversation."
                    : "No messages yet. Start the conversation!"}
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderId === currentUserId}
                otherUser={otherUser}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input - hidden in read-only mode */}
      {!readOnly && <MessageInput connectionId={connectionId} />}
    </div>
  );
}