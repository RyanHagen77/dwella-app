/**
 * PENDING WORK BADGE
 *
 * Shows total pending document-completed-service-submissions items for the current user.
 * - Homeowners: Work items across ALL stats they own
 * - Contractors: Work requests received
 * Polls API every 30 seconds.
 *
 * Usage in navigation/pickers:
 * <PendingServiceBadge />
 *
 * Location: src/components/ui/PendingServiceBadge.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export function PendingServiceBadge() {
  const [serviceCount, setServiceCount] = useState(0);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchWork = async () => {
      try {
        const response = await fetch("/api/pending-completed-service-submissions");
        if (response.ok) {
          const data = await response.json();
          setServiceCount(data.total || 0);
        }
      } catch (error) {
        console.error("Failed to fetch pending service submissions count:", error);
      }
    };

    // Only fetch if user is authenticated
    if (session?.user) {
      fetchService();

      // Poll every 30 seconds
      const interval = setInterval(fetchWork, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  if (serviceCount === 0) return null;

  return (
    <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-[#33C17D] px-2 py-0.5 text-xs font-bold text-white min-w-[20px]">
      {serviceCount > 99 ? "99+" : serviceCount}
    </span>
  );
}