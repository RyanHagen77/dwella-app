/**
 * PENDING INVITATIONS BADGE FOR HOMEOWNERS
 *
 * Shows total pending invitations across ALL homes owned by the user.
 * Polls API every 30 seconds.
 *
 * Usage in HomePicker or navigation:
 * <UnreadInvitationsBadgeHomeowner />
 *
 * Location: app/home/_components/UnreadInvitationsBadgeHomeowner.tsx
 */

"use client";

import { useEffect, useState } from "react";

export function UnreadInvitationsBadgeHomeowner() {
  const [invitationsCount, setInvitationsCount] = useState(0);

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

    // Fetch immediately
    fetchInvitations();

    // Poll every 30 seconds
    const interval = setInterval(fetchInvitations, 30000);

    return () => clearInterval(interval);
  }, []);

  if (invitationsCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-blue-500 px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {invitationsCount > 99 ? "99+" : invitationsCount}
    </span>
  );
}