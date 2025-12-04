// app/home/_components/UnreadMessagesAlert.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type UnreadMessagesAlertProps = {
  homeId: string;
};

type UnreadResponse = {
  total?: number;
  count?: number;
  unread?: number;
};

async function fetchUnreadMessages(homeId: string): Promise<number> {
  try {
    const res = await fetch(`/api/home/${homeId}/messages/unread`, {
      cache: "no-store",
    });
    if (!res.ok) return 0;

    let data: UnreadResponse = {};
    try {
      data = (await res.json()) as UnreadResponse;
    } catch {
      data = {};
    }

    // Support any of: { total }, { count }, { unread }
    return data.total ?? data.count ?? data.unread ?? 0;
  } catch (err) {
    console.error("Failed to fetch unread messages", err);
    return 0;
  }
}

export function UnreadMessagesAlert({ homeId }: UnreadMessagesAlertProps) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const value = await fetchUnreadMessages(homeId);
      if (!cancelled) {
        setCount(value);
        setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [homeId]);

  // If still loading, or nothing unread, don't show the tile
  if (loading || !count) return null;

  return (
    <Link
      href={`/home/${homeId}/messages`}
      className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl">💬</span>
        <div>
          <p className="text-sm font-medium text-white">Unread messages</p>
          <p className="text-xs text-white/60">
            You have {count} unread message{count !== 1 ? "s" : ""}.
          </p>
        </div>
      </div>
      <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
        {count}
      </span>
    </Link>
  );
}