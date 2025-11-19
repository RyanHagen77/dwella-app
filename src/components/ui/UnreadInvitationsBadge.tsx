/**
 * PENDING INVITATIONS BADGE
 *
 * Shows total pending invitations for the current user.
 * - Homeowners: Invitations across ALL homes they own
 * - Contractors: Invitations received
 * Polls API every 30 seconds.
 *
 * Usage in navigation/pickers:
 * <UnreadInvitationsBadge />
 *
 * Location: src/components/ui/UnreadInvitationsBadge.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function UnreadInvitationsBadge() {
  const [invitationsCount, setInvitationsCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchInvitations = async () => {
      try {
        const response = await fetch("/api/invitations/pending");
        if (response.ok) {
          const data = await response.json();
          setInvitationsCount(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch invitations count:", error);
      }
    };

    // Only fetch if user is authenticated
    if (session?.user) {
      fetchInvitations();

      // Poll every 30 seconds
      const interval = setInterval(fetchInvitations, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (invitationsCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {invitationsCount > 99 ? "99+" : invitationsCount}
    </span>
  );
}