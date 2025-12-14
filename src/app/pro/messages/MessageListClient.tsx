/**
 * MESSAGES LIST CLIENT COMPONENT
 *
 * Client component that polls for message updates.
 * Shows conversations with live unread counts.
 * Supports Active/Archived view.
 * Adds search + filter + sort controls (matching Properties page styling).
 *
 * Location: app/(pro)/pro/messages/MessageListClient.tsx
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { glass, textMeta, ctaGhost } from "@/lib/glass";

/* =========================
   Types
========================= */

type Conversation = {
  connectionId: string;
  homeowner: {
    name: string;
    image: string | null;
  };
  property: {
    address: string;
    city: string | null;
    state: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string | Date;
    isRead: boolean;
  } | null;
  unreadCount: number;
  isArchived: boolean;
  archivedAt: Date | null;
};

type FilterType = "all" | "unread";
type SortKey = "recent" | "unread" | "homeowner" | "address";

/* =========================
   Helpers
========================= */

function safeLower(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

function toTime(v: string | Date | null | undefined) {
  if (!v) return 0;
  const d = typeof v === "string" ? new Date(v) : v;
  const t = d.getTime();
  return Number.isNaN(t) ? 0 : t;
}

/* =========================
   Control styling (match Properties)
========================= */

const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/35";

const selectInner =
  fieldInner + " appearance-none pr-10 outline-none focus:outline-none ring-0 focus:ring-0";

/* =========================
   Component
========================= */

export function MessageListClient({
  activeConversations: initialActive,
  archivedConversations: initialArchived,
}: {
  activeConversations: Conversation[];
  archivedConversations: Conversation[];
}) {
  const [view, setView] = useState<"active" | "archived">("active");
  const [activeConversations, setActiveConversations] = useState(initialActive);
  const [archivedConversations] = useState(initialArchived);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortKey>("recent");

  const isArchivedView = view === "archived";
  const base = isArchivedView ? archivedConversations : activeConversations;

  // Poll only for active conversations
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch("/api/messages/conversations");
        if (!response.ok) return;
        const data = await response.json();
        const active = (data.conversations || []).filter(
          (c: Conversation) => !c.isArchived
        );
        setActiveConversations(active);
      } catch (error) {
        console.error("Failed to fetch message updates:", error);
      }
    };

    const interval = window.setInterval(fetchUpdates, 10000);
    return () => window.clearInterval(interval);
  }, []);

  /* -------------------------
     Search
  ------------------------- */
  const searched = useMemo(() => {
    if (!searchQuery.trim()) return [...base];
    const q = searchQuery.toLowerCase();

    return base.filter((c) => {
      const addressLine = [c.property.address, c.property.city, c.property.state]
        .filter(Boolean)
        .join(", ");

      return (
        safeLower(c.homeowner.name).includes(q) ||
        safeLower(addressLine).includes(q) ||
        safeLower(c.property.address).includes(q) ||
        safeLower(c.property.city).includes(q) ||
        safeLower(c.property.state).includes(q)
      );
    });
  }, [base, searchQuery]);

  /* -------------------------
     Counts (based on searched list)
  ------------------------- */
  const counts = useMemo(() => {
    const unread = searched.filter((c) => !c.isArchived && c.unreadCount > 0).length;

    return {
      all: searched.length,
      unread,
      activeTotal: activeConversations.length,
      archivedTotal: archivedConversations.length,
    };
  }, [searched, activeConversations.length, archivedConversations.length]);

  /* -------------------------
     Filter + Sort
  ------------------------- */
  const filtered = useMemo(() => {
    let list = [...searched];

    // Filter only applies to active view
    if (!isArchivedView && filter === "unread") {
      list = list.filter((c) => c.unreadCount > 0);
    }

    // Sort
    list.sort((a, b) => {
      if (sort === "homeowner") return a.homeowner.name.localeCompare(b.homeowner.name);

      if (sort === "address") {
        const aa = a.property.address || "";
        const bb = b.property.address || "";
        return aa.localeCompare(bb);
      }

      if (sort === "unread") {
        const au = a.isArchived ? 0 : a.unreadCount;
        const bu = b.isArchived ? 0 : b.unreadCount;
        if (bu !== au) return bu - au;

        // tie-breaker: recent
        const at = toTime(a.lastMessage?.createdAt);
        const bt = toTime(b.lastMessage?.createdAt);
        return bt - at;
      }

      // recent (default)
      if (isArchivedView) {
        const at = toTime(a.archivedAt);
        const bt = toTime(b.archivedAt);
        return bt - at;
      } else {
        const at = toTime(a.lastMessage?.createdAt);
        const bt = toTime(b.lastMessage?.createdAt);
        return bt - at;
      }
    });

    return list;
  }, [searched, filter, sort, isArchivedView]);

  const showClear =
    searchQuery.trim() ||
    isArchivedView ||
    (!isArchivedView && filter !== "all") ||
    sort !== "recent";

  function clearAll() {
    setSearchQuery("");
    setView("active");
    setFilter("all");
    setSort("recent");
  }

  /* =========================
     Render
  ========================= */

  return (
    <div className="space-y-6">
      {/* Controls (glass like Properties) */}
      <section className={glass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          {/* Search */}
          <div className="flex-1">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Search
            </label>
            <div className={fieldShell}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by homeowner or address…"
                className={fieldInner}
              />
            </div>
          </div>

          {/* View */}
          <div className="w-full md:w-56">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              View
            </label>
            <div className={`${fieldShell} relative`}>
              <select
                value={view}
                onChange={(e) => setView(e.target.value as "active" | "archived")}
                className={selectInner}
              >
                <option value="active" className="bg-gray-900">
                  Active ({counts.activeTotal})
                </option>
                <option value="archived" className="bg-gray-900">
                  Archived ({counts.archivedTotal})
                </option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                ▾
              </span>
            </div>
          </div>

          {/* Filter */}
          <div className="w-full md:w-56">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Filter
            </label>
            <div className={`${fieldShell} relative ${isArchivedView ? "opacity-60" : ""}`}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                disabled={isArchivedView}
                className={selectInner}
              >
                <option value="all" className="bg-gray-900">
                  All ({counts.all})
                </option>
                <option value="unread" className="bg-gray-900">
                  Unread ({counts.unread})
                </option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                ▾
              </span>
            </div>
          </div>

          {/* Sort */}
          <div className="w-full md:w-56">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Sort
            </label>
            <div className={`${fieldShell} relative`}>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectInner}>
                {isArchivedView ? (
                  <>
                    <option value="recent" className="bg-gray-900">
                      Most Recently Archived
                    </option>
                    <option value="homeowner" className="bg-gray-900">
                      Homeowner (A–Z)
                    </option>
                    <option value="address" className="bg-gray-900">
                      Address (A–Z)
                    </option>
                  </>
                ) : (
                  <>
                    <option value="recent" className="bg-gray-900">
                      Most Recent
                    </option>
                    <option value="unread" className="bg-gray-900">
                      Unread First
                    </option>
                    <option value="homeowner" className="bg-gray-900">
                      Homeowner (A–Z)
                    </option>
                    <option value="address" className="bg-gray-900">
                      Address (A–Z)
                    </option>
                  </>
                )}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                ▾
              </span>
            </div>
          </div>

          {showClear ? (
            <div className="flex md:justify-end">
              <button type="button" onClick={clearAll} className={ctaGhost}>
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {/* Threads “floating” (NO glass wrapper) */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
          <p className="mb-2 text-white/80">
            {isArchivedView ? "No archived conversations" : "No conversations match your filters"}
          </p>
          <p className={`text-sm ${textMeta}`}>
            Try a different search, or switch views.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((conv) => (
            <ConversationRowCard key={conv.connectionId} conv={conv} />
          ))}
        </ul>
      )}
    </div>
  );
}

/* =========================
   Row card (match Properties row style)
========================= */

function ConversationRowCard({ conv }: { conv: Conversation }) {
  const addressLine = [conv.property.address, conv.property.city, conv.property.state]
    .filter(Boolean)
    .join(", ");

  const lastAt = conv.lastMessage?.createdAt
    ? formatDistanceToNow(new Date(conv.lastMessage.createdAt), { addSuffix: true })
    : null;

  const showUnread = !conv.isArchived && conv.unreadCount > 0;

  // ✅ Green default, orange if unread, muted if archived
  const leftAccent = conv.isArchived
    ? "before:bg-white/15"
    : showUnread
    ? "before:bg-orange-400/80"
    : "before:bg-emerald-400/60";

  return (
    <li
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/10",
        "bg-black/35 backdrop-blur",
        "hover:border-white/18 hover:bg-black/45 transition",
        // ✅ IMPORTANT: before needs content to render
        "before:content-[''] before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
        leftAccent,
      ].join(" ")}
    >
      <Link href={`/pro/messages/${conv.connectionId}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex gap-3">
            {/* Avatar */}
            <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
              {conv.homeowner.image ? (
                <div className="relative h-full w-full">
                  <Image
                    src={conv.homeowner.image}
                    alt={conv.homeowner.name}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="text-lg font-semibold text-white/90">
                  {conv.homeowner.name?.[0]?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            {/* Main */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="truncate text-[15px] font-semibold text-white">
                  {conv.homeowner.name}
                </h3>

                {conv.isArchived && (
                  <span className="flex-shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                    Archived
                  </span>
                )}

                {showUnread && (
                  <span className="flex-shrink-0 rounded-full border border-orange-400/40 bg-orange-500/15 px-2 py-0.5 text-[11px] text-orange-200">
                    Unread
                  </span>
                )}
              </div>

              {addressLine && (
                <p className={`mt-1 truncate text-xs ${textMeta}`}>{addressLine}</p>
              )}

              {conv.lastMessage ? (
                <p className={["mt-2 truncate text-sm", showUnread ? "text-white" : "text-white/70"].join(" ")}>
                  {conv.lastMessage.content}
                </p>
              ) : (
                <p className={`mt-2 text-sm ${textMeta}`}>No messages yet.</p>
              )}
            </div>
          </div>

          {/* Right */}
          <div className="shrink-0 text-right">
            {lastAt ? <p className={`text-xs ${textMeta}`}>{lastAt}</p> : null}

            {!conv.isArchived && conv.unreadCount > 0 ? (
              <div className="mt-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-orange-500/90 px-2">
                <span className="text-xs font-bold text-white">
                  {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                </span>
              </div>
            ) : (
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-white/60 opacity-0 transition group-hover:opacity-100">
                <span>Open</span>
                <span aria-hidden>→</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}