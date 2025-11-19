"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClaimHomeModal } from "./ClaimHomeModal";
import { UnreadMessageBadge } from "@/components/ui/UnreadMessageBadge";
import { UnreadInvitationsBadge } from "@/components/ui//UnreadInvitationsBadge";
import { PendingWorkBadge } from "@/components/ui/PendingWorkBadge";

type Home = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
};

type HomeStats = {
  homeId: string;
  unreadMessages: number;
  pendingInvitations: number;
  pendingWork: number;
};

export function HomePicker({
  currentHomeId,
  initialAddress,
}: {
  currentHomeId: string;
  initialAddress: string;
}) {
  const router = useRouter();

  const [homes, setHomes] = React.useState<Home[]>([]);
  const [homeStats, setHomeStats] = React.useState<HomeStats[]>([]);
  const [open, setOpen] = React.useState(false);
  const [claimOpen, setClaimOpen] = React.useState(false);

  React.useEffect(() => {
    async function fetchHomes() {
      try {
        const res = await fetch("/api/user/homes");
        if (!res.ok) return;
        const data = await res.json();
        setHomes(data.homes || []);
      } catch (err) {
        console.error("Failed to fetch homes", err);
      }
    }
    void fetchHomes();
  }, []);

  // Fetch per-home stats when dropdown opens
  React.useEffect(() => {
    if (!open || homes.length === 0) return;

    async function fetchHomeStats() {
      try {
        // Fetch stats for each home
        const statsPromises = homes.map(async (home) => {
          const [messagesRes, invitesRes, workRes] = await Promise.all([
            fetch(`/api/home/${home.id}/messages/unread`),
            fetch(`/api/home/${home.id}/invitations?status=PENDING`),
            fetch(`/api/home/${home.id}/work/pending`),
          ]);

          const messagesData = messagesRes.ok ? await messagesRes.json() : { total: 0 };
          const invitesData = invitesRes.ok ? await invitesRes.json() : {};
          const workData = workRes.ok ? await workRes.json() : { totalPending: 0 };

          const pendingInvites =
            (invitesData.sentInvitations?.filter((inv: { status: string }) => inv.status === 'PENDING').length || 0) +
            (invitesData.receivedInvitations?.filter((inv: { status: string }) => inv.status === 'PENDING').length || 0);

          return {
            homeId: home.id,
            unreadMessages: messagesData.total || 0,
            pendingInvitations: pendingInvites,
            pendingWork: workData.totalPending || 0,
          };
        });

        const stats = await Promise.all(statsPromises);
        setHomeStats(stats);
      } catch (err) {
        console.error("Failed to fetch home stats", err);
      }
    }

    void fetchHomeStats();
  }, [open, homes]);

  const currentHome =
    homes.find((h) => h.id === currentHomeId) ||
    (homes.length > 0 ? homes[0] : null);

  function formatAddress(home: Home) {
    return `${home.address}${home.city ? `, ${home.city}` : ""}${
      home.state ? `, ${home.state}` : ""
    }${home.zip ? ` ${home.zip}` : ""}`;
  }

  const displayAddress =
    currentHome != null ? formatAddress(currentHome) : initialAddress;

  async function switchHome(homeId: string) {
    setOpen(false);

    try {
      await fetch("/api/user/last-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ homeId }),
      });
    } catch (err) {
      console.error("Failed to update last home", err);
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("lastHomeId", homeId);
    }

    router.push(`/home/${homeId}`);
  }

  function getStatsForHome(homeId: string) {
    return homeStats.find((s) => s.homeId === homeId) || {
      homeId,
      unreadMessages: 0,
      pendingInvitations: 0,
      pendingWork: 0,
    };
  }

  return (
    <>
      {/* wrapper gets its own stack level */}
      <div className="relative z-[30] w-full max-w-sm text-left">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 rounded-full border border-white/25 bg-black/35 px-3 py-1.5 text-xs sm:text-sm text-white hover:bg-black/50 backdrop-blur-sm"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/12 flex-shrink-0">
            <HomeGlyph />
          </span>

          <span className="flex-1 min-w-0 truncate text-left">
            {displayAddress}
          </span>

          {/* Badges */}
          <UnreadMessageBadge />
          <UnreadInvitationsBadge/>
          <PendingWorkBadge />

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 flex-shrink-0 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.7}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {open && (
          <>
            {/* backdrop over page but under menu */}
            <div
              className="fixed inset-0 z-[40]"
              onClick={() => setOpen(false)}
            />

            {/* dropdown itself */}
            <div
              className="absolute left-0 top-full z-[50] mt-2
                         w-[min(304px,calc(100vw-3rem))]
                         rounded-2xl border border-white/15 bg-black/90
                         backdrop-blur-xl shadow-2xl"
            >
              <div className="border-b border-white/10 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                  Your homes
                </p>
              </div>

              <div className="max-h-56 space-y-1 overflow-y-auto px-2 py-2">
                {homes.map((home) => {
                  const isCurrent = home.id === currentHomeId;
                  const stats = getStatsForHome(home.id);
                  const hasActivity = stats.unreadMessages > 0 || stats.pendingInvitations > 0 || stats.pendingWork > 0;

                  return (
                    <button
                      key={home.id}
                      type="button"
                      onClick={() => switchHome(home.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                        isCurrent
                          ? "bg-white/15 border-white/35"
                          : "bg-white/5 border-transparent hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-white">
                            {formatAddress(home)}
                          </p>
                          {isCurrent && (
                            <p className="mt-1 text-xs text-emerald-300">
                              Current home
                            </p>
                          )}
                        </div>

                        {/* Per-home badges */}
                        {hasActivity && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {stats.unreadMessages > 0 && (
                              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500 px-2 text-xs font-bold text-white">
                                {stats.unreadMessages}
                              </span>
                            )}
                            {stats.pendingInvitations > 0 && (
                              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-blue-500 px-2 text-xs font-bold text-white">
                                {stats.pendingInvitations}
                              </span>
                            )}
                            {stats.pendingWork > 0 && (
                              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[#33C17D] px-2 text-xs font-bold text-white">
                                {stats.pendingWork}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}

                {homes.length === 0 && (
                  <p className="px-3 py-2 text-xs text-white/70">
                    No homes yet. Add your first home to get started.
                  </p>
                )}
              </div>

              <div className="border-t border-white/10 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setClaimOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20"
                >
                  <span className="text-base leading-none">＋</span>
                  <span>Add another home</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ClaimHomeModal
        open={claimOpen}
        onCloseAction={() => {
          setClaimOpen(false);
          void fetch("/api/user/homes")
            .then((res) => res.json())
            .then((data) => setHomes(data.homes || []))
            .catch(console.error);
        }}
      />
    </>
  );
}

/** Mini logo-style house icon */
function HomeGlyph() {
  return (
    <svg viewBox="0 0 72 72" className="h-5 w-5" aria-hidden="true">
      <path
        d="M18 52C16.343 52 15 50.657 15 49V27.414C15 26.52 15.36 25.661 16 25.02L35.586 5.434C36.367 4.653 37.633 4.653 38.414 5.434L58 25.02C58.64 25.661 59 26.52 59 27.414V49C59 50.657 57.657 52 56 52H42C40.343 52 39 50.657 39 49V39H25V49C25 50.657 23.657 52 22 52H18Z"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M32.5 34L40 41.5L54 27.5"
        stroke="#33C17D"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}