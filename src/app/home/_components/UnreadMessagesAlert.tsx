"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { glass, heading } from "@/lib/glass";

type UnreadMessagesAlertProps = {
  homeId: string;
  pendingWorkSubmissionsCount: number;
  pendingServiceRequestsCount: number;
  pendingInvitationsCount: number;
};

// Shape-flexible response so we don't need `any`
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

    // Support a few possible field names without using `any`
    return data.total ?? data.count ?? data.unread ?? 0;
  } catch (err: unknown) {
    console.error("Failed to fetch unread messages", err);
    return 0;
  }
}

export function UnreadMessagesAlert({
  homeId,
  pendingWorkSubmissionsCount,
  pendingServiceRequestsCount,
  pendingInvitationsCount,
}: UnreadMessagesAlertProps) {
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const count = await fetchUnreadMessages(homeId);
      if (!cancelled) {
        setUnreadMessages(count);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [homeId]);

  const hasServerItems =
    pendingWorkSubmissionsCount > 0 ||
    pendingServiceRequestsCount > 0 ||
    pendingInvitationsCount > 0;

  const hasUnread = unreadMessages > 0;
  const hasAnything = hasServerItems || hasUnread;

  if (!hasAnything) return null;

  return (
    <section className={`${glass} border-l-4 border-orange-400`}>
      <h2
        className={`mb-4 text-lg font-semibold text-orange-400 ${heading}`}
      >
        ⚡ Needs Your Attention
      </h2>
      <div className="space-y-3">
        {/* 🔸 Unread messages tile */}
        {hasUnread && (
          <Link
            href={`/home/${homeId}/messages`}
            className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-sm font-medium text-white">
                  Unread messages
                </p>
                <p className="text-xs text-white/60">
                  {unreadMessages === 1
                    ? "You have 1 unread message."
                    : `You have ${unreadMessages} unread messages.`}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {unreadMessages}
            </span>
          </Link>
        )}

        {/* Your existing tiles, unchanged except using props */}

        {pendingWorkSubmissionsCount > 0 && (
          <Link
            href={`/home/${homeId}/completed-work-submissions`}
            className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <p className="text-sm font-medium text-white">
                  Review Completed Work
                </p>
                <p className="text-xs text-white/60">
                  {pendingWorkSubmissionsCount} submission
                  {pendingWorkSubmissionsCount !== 1 ? "s" : ""} awaiting
                  approval
                </p>
              </div>
            </div>
            <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {pendingWorkSubmissionsCount}
            </span>
          </Link>
        )}

        {pendingServiceRequestsCount > 0 && (
          <Link
            href={`/home/${homeId}/completed-work-submissions`}
            className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔧</span>
              <div>
                <p className="text-sm font-medium text-white">
                  Service Requests
                </p>
                <p className="text-xs text-white/60">
                  {pendingServiceRequestsCount} request
                  {pendingServiceRequestsCount !== 1 ? "s" : ""} pending
                  response
                </p>
              </div>
            </div>
            <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {pendingServiceRequestsCount}
            </span>
          </Link>
        )}

        {pendingInvitationsCount > 0 && (
          <Link
            href={`/home/${homeId}/invitations`}
            className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">✉️</span>
              <div>
                <p className="text-sm font-medium text-white">
                  Pending Invitations
                </p>
                <p className="text-xs text-white/60">
                  {pendingInvitationsCount} invitation
                  {pendingInvitationsCount !== 1 ? "s" : ""} awaiting
                  response
                </p>
              </div>
            </div>
            <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
              {pendingInvitationsCount}
            </span>
          </Link>
        )}
      </div>
    </section>
  );
}