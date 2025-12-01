/**
 * UNREAD MESSAGE BADGE
 *
 * Shows total unread messages for the current user.
 * - Homeowners: Across ALL stats they own
 * - Contractors: Across ALL connections
 * Polls API every 30 seconds.
 *
 * Usage in navigation/pickers:
 * <UnreadMessageBadge />
 *
 * Location: src/components/ui/UnreadMessageBadge.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function UnreadMessageBadge() {
  const [unreadCount, setUnreadCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const response = await fetch("/api/messages/unread");
        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread count:", error);
      }
    };

    // Only fetch if user is authenticated
    if (session?.user) {
      fetchUnread();

      // Poll every 30 seconds
      const interval = setInterval(fetchUnread, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (unreadCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );
}