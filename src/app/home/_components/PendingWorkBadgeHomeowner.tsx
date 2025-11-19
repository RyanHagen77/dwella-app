/**
 * PENDING WORK BADGE FOR HOMEOWNERS
 *
 * Shows total pending work items across ALL homes owned by the user.
 * Polls API every 30 seconds.
 *
 * Usage in HomePicker or navigation:
 * <PendingWorkBadgeHomeowner />
 *
 * Location: app/home/_components/PendingWorkBadgeHomeowner.tsx
 */

"use client";

import { useEffect, useState } from "react";

export function PendingWorkBadgeHomeowner() {
  const [workCount, setWorkCount] = useState(0);

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

    // Fetch immediately
    fetchWork();

    // Poll every 30 seconds
    const interval = setInterval(fetchWork, 30000);

    return () => clearInterval(interval);
  }, []);

  if (workCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#33C17D] px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {workCount > 99 ? "99+" : workCount}
    </span>
  );
}