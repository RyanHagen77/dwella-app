/**
 * MESSAGE INPUT COMPONENT
 *
 * Text input field with send button for composing messages.
 * Handles sending messages via API.
 * Works for all pro types.
 *
 * Location: app/(pro)/pro/messages/[connectionId]/_components/MessageInput.tsx
 */

"use client";

import { useState, FormEvent } from "react";

type Props = {
  connectionId: string;
};

export function MessageInput({ connectionId }: Props) {
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/messages/${connectionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to send messages");
      }

      setContent("");
    } catch (error) {
      console.error("Failed to send messages:", error);
      alert("Failed to send messages. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-shrink-0 border-t border-white/10 bg-black/30 backdrop-blur-sm"
    >
      <div className="mx-auto max-w-3xl p-4">
        <div className="flex gap-2 items-end">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Press Enter to send)"
            rows={1}
            className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none min-h-[48px] max-h-[200px]"
            disabled={sending}
            style={{
              height: 'auto',
              minHeight: '48px',
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
          <button
            type="submit"
            disabled={!content.trim() || sending}
            className="rounded-lg bg-orange-500 px-6 py-3 font-medium text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </form>
  );
}