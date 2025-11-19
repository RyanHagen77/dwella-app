/**
 * PENDING WORK BADGE
 *
 * Shows total pending work items for the current user.
 * - Homeowners: Work items across ALL homes they own
 * - Contractors: Work requests received
 * Polls API every 30 seconds.
 *
 * Usage in navigation/pickers:
 * <PendingWorkBadge />
 *
 * Location: src/components/ui/PendingWorkBadge.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function PendingWorkBadge() {
  const [workCount, setWorkCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const response = await fetch("/api/work/pending");
        if (response.ok) {
          const data = await response.json();
          setWorkCount(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending work count:", error);
      }
    };

    // Only fetch if user is authenticated
    if (session?.user) {
      fetchWork();

      // Poll every 30 seconds
      const interval = setInterval(fetchWork, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (workCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#33C17D] px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {workCount > 99 ? "99+" : workCount}
    </span>
  );
}