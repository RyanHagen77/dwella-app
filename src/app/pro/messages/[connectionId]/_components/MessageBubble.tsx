/**
 * MESSAGE BUBBLE COMPONENT
 *
 * Displays an individual messages with proper styling for sent/received.
 * Shows timestamp and attachments if present.
 * Works for all pro types.
 *
 * Location: app/(pro)/pro/messages/[connectionId]/_components/MessageBubble.tsx
 */

"use client";

import Image from "next/image";
import { format, isToday, isYesterday } from "date-fns";

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
};

type Props = {
  message: Message;
  isOwn: boolean;
  otherUser: {
    name: string;
    image: string | null;
  };
};

export function MessageBubble({ message, isOwn, otherUser }: Props) {
  // Format timestamp with date
  const formatTimestamp = (date: Date) => {
    const messageDate = new Date(date);

    if (isToday(messageDate)) {
      return `Today ${format(messageDate, "h:mm a")}`;
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, "h:mm a")}`;
    } else {
      return format(messageDate, "MMM d, h:mm a");
    }
  };

  return (
    <div className={`flex gap-3 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {otherUser.image ? (
            <Image
              src={otherUser.image}
              alt={otherUser.name}
              width={32}
              height={32}
              className="rounded-full"
            />
          ) : (
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
              <span className="text-xs font-medium">
                {otherUser.name[0]?.toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Message content */}
      <div className={`flex flex-col gap-1 max-w-[70%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-2 ${
            isOwn
              ? "bg-orange-500 text-white"
              : "bg-white/10 backdrop-blur-sm text-white border border-white/20"
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>

          {/* Attachments */}
          {message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment) => (
                <a
                  key={attachment.id}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs opacity-90 hover:opacity-100 underline"
                >
                  📎 {attachment.filename}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <p className="text-xs text-white/50 px-1">
          {formatTimestamp(message.createdAt)}
        </p>
      </div>
    </div>
  );
}