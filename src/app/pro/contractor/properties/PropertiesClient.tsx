"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";
import { glass, textMeta, ctaGhost } from "@/lib/glass";

/* =========================
   Types
========================= */

type Property = {
  id: string;
  connectionId: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  homeownerName: string;
  homeownerEmail: string;
  homeownerImage: string | null;
  connectionStatus: string;
  isArchived: boolean;
  archivedAt: string | null;
  serviceCount: number;
  lastServiceDate: string | null;
  lastServiceTitle: string | null;
  imageUrl: string | null;
  verifiedServiceCount: number;
  totalSpent: number | null;
  daysSinceLastService: number | null;
  expiringWarranties: Array<{ item: string; expiresAt: string; daysUntil: number }>;
  upcomingReminders: Array<{ title: string; dueAt: string; daysUntil: number }>;
  pendingRequests: Array<{ id: string; title: string; urgency: string }>;
};

type PropertiesClientProps = {
  activeProperties: Property[];
  archivedProperties: Property[];
};

type FilterType = "all" | "opportunities" | "needs-attention" | "pending";
type SortKey = "priority" | "recent" | "address" | "homeowner";

/* =========================
   Helpers
========================= */

function safeLower(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMoney(v: number) {
  return `$${v.toFixed(2)}`;
}

/* =========================
   Control styling (same as Service Records)
========================= */

const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/35";

const selectInner =
  fieldInner +
  " appearance-none pr-10 outline-none focus:outline-none ring-0 focus:ring-0";
/* =========================
   Component
========================= */

export function PropertiesClient({
  activeProperties,
  archivedProperties,
}: PropertiesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<number | null>(null);

  const [view, setView] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortKey>("priority");

  const isArchivedView = view === "archived";

  const properties = isArchivedView ? archivedProperties : activeProperties;

  /* -------------------------
     URL sync (optional)
  ------------------------- */

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());

      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      else params.delete("search");

      if (isArchivedView) params.set("view", "archived");
      else params.delete("view");

      if (!isArchivedView && filter !== "all") params.set("filter", filter);
      else params.delete("filter");

      if (sort !== (isArchivedView ? "recent" : "priority")) {
        params.set("sort", sort);
      } else {
        params.delete("sort");
      }

      const qs = params.toString();
      router.push(`/pro/contractor/properties${qs ? `?${qs}` : ""}`);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, view, filter, sort]);

  /* -------------------------
     Search
  ------------------------- */

  const searched = useMemo(() => {
    if (!searchQuery.trim()) return [...properties];

    const q = searchQuery.toLowerCase();
    return properties.filter(
      (p) =>
        safeLower(p.address).includes(q) ||
        safeLower(p.city).includes(q) ||
        safeLower(p.state).includes(q) ||
        safeLower(p.homeownerName).includes(q) ||
        safeLower(p.homeownerEmail).includes(q)
    );
  }, [properties, searchQuery]);

  /* -------------------------
     Counts (based on searched list)
  ------------------------- */

  const counts = useMemo(() => {
    const opportunities = searched.filter(
      (p) =>
        (p.expiringWarranties?.length || 0) +
          (p.upcomingReminders?.length || 0) >
        0
    ).length;

    const needsAttention = searched.filter(
      (p) => !p.lastServiceDate || (p.daysSinceLastService ?? 999) > 180
    ).length;

    const pending = searched.filter(
      (p) => (p.pendingRequests?.length || 0) > 0
    ).length;

    return {
      all: searched.length,
      opportunities,
      needsAttention,
      pending,
      activeTotal: activeProperties.length,
      archivedTotal: archivedProperties.length,
    };
  }, [searched, activeProperties.length, archivedProperties.length]);

  /* -------------------------
     Filter + Sort
  ------------------------- */

  const filtered = useMemo(() => {
    let list = [...searched];

    if (!isArchivedView) {
      if (filter === "opportunities") {
        list = list.filter(
          (p) =>
            (p.expiringWarranties?.length || 0) +
              (p.upcomingReminders?.length || 0) >
            0
        );
      } else if (filter === "needs-attention") {
        list = list.filter(
          (p) => !p.lastServiceDate || (p.daysSinceLastService ?? 999) > 180
        );
      } else if (filter === "pending") {
        list = list.filter((p) => (p.pendingRequests?.length || 0) > 0);
      }
    }

    if (isArchivedView) {
      return list.sort((a, b) => {
        const aDate = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
        const bDate = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
        return bDate - aDate;
      });
    }

    return list.sort((a, b) => {
      if (sort === "address") return a.address.localeCompare(b.address);
      if (sort === "homeowner")
        return a.homeownerName.localeCompare(b.homeownerName);

      if (sort === "recent") {
        const ad = a.lastServiceDate ? new Date(a.lastServiceDate).getTime() : 0;
        const bd = b.lastServiceDate ? new Date(b.lastServiceDate).getTime() : 0;
        return bd - ad;
      }

      // priority
      const ap = a.pendingRequests?.length || 0;
      const bp = b.pendingRequests?.length || 0;
      if (ap !== bp) return bp - ap;

      const ao =
        (a.expiringWarranties?.length || 0) +
        (a.upcomingReminders?.length || 0);
      const bo =
        (b.expiringWarranties?.length || 0) +
        (b.upcomingReminders?.length || 0);
      if (ao !== bo) return bo - ao;

      const an =
        !a.lastServiceDate || (a.daysSinceLastService ?? 999) > 180;
      const bn =
        !b.lastServiceDate || (b.daysSinceLastService ?? 999) > 180;
      if (an && !bn) return -1;
      if (!an && bn) return 1;

      return 0;
    });
  }, [searched, filter, sort, isArchivedView]);

  const showClear =
    searchQuery.trim() ||
    isArchivedView ||
    (!isArchivedView && filter !== "all") ||
    sort !== (isArchivedView ? "recent" : "priority");

  /* =========================
     Render
  ========================= */

  return (
    <div className="space-y-6">
      {/* Controls */}
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
                placeholder={isArchivedView ? "Search archived…" : "Search properties…"}
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
                onChange={(e) =>
                  setView(e.target.value as "active" | "archived")
                }
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
            <div
              className={`${fieldShell} relative ${
                isArchivedView ? "opacity-60" : ""
              }`}
            >
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                disabled={isArchivedView}
                className={selectInner}
              >
                <option value="all" className="bg-gray-900">
                  All ({counts.all})
                </option>
                <option value="pending" className="bg-gray-900">
                  Pending ({counts.pending})
                </option>
                <option value="opportunities" className="bg-gray-900">
                  Opportunities ({counts.opportunities})
                </option>
                <option value="needs-attention" className="bg-gray-900">
                  Follow-up ({counts.needsAttention})
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
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className={selectInner}
              >
                {isArchivedView ? (
                  <>
                    <option value="recent" className="bg-gray-900">
                      Most Recently Archived
                    </option>
                    <option value="address" className="bg-gray-900">
                      Address (A–Z)
                    </option>
                    <option value="homeowner" className="bg-gray-900">
                      Homeowner (A–Z)
                    </option>
                  </>
                ) : (
                  <>
                    <option value="priority" className="bg-gray-900">
                      Priority
                    </option>
                    <option value="recent" className="bg-gray-900">
                      Recent Service
                    </option>
                    <option value="address" className="bg-gray-900">
                      Address (A–Z)
                    </option>
                    <option value="homeowner" className="bg-gray-900">
                      Homeowner (A–Z)
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
              <Link href="/pro/contractor/properties" className={ctaGhost}>
                Clear
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      {/* List */}
      <section className={glass}>
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="mb-4 text-white/70">No properties match your filters.</p>
            <Link href="/pro/contractor/properties" className={ctaGhost}>
              Reset view
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((p) => (
              <PropertyRowCard key={p.id} property={p} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* =========================
   Row Card
========================= */

function PropertyRowCard({ property }: { property: Property }) {
  const hasPending = (property.pendingRequests?.length || 0) > 0;
  const hasOpps =
    (property.expiringWarranties?.length || 0) +
      (property.upcomingReminders?.length || 0) >
    0;
  const needsAttention =
    !property.lastServiceDate || (property.daysSinceLastService ?? 999) > 180;

  const leftAccent =
    property.isArchived
      ? "before:bg-white/20"
      : hasPending
      ? "before:bg-amber-400/70"
      : hasOpps
      ? "before:bg-sky-400/70"
      : needsAttention
      ? "before:bg-yellow-400/60"
      : "before:bg-emerald-400/40";

  return (
    <li
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/10",
        "bg-black/35 backdrop-blur",
        "hover:border-white/18 hover:bg-black/45 transition",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
        leftAccent,
      ].join(" ")}
    >
      <Link href={`/pro/contractor/properties/${property.id}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex gap-3">
            <div className="h-12 w-12 rounded-xl border border-white/10 bg-white/5 overflow-hidden">
              {property.imageUrl && (
                <Image src={property.imageUrl} alt="" width={48} height={48} />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-white">
                {property.homeownerName}
              </h3>

              <p className="mt-1 truncate text-xs text-white/55">
                {property.address}
              </p>

              <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs ${textMeta}`}>
                <span>{property.serviceCount} services</span>
                {property.totalSpent ? <span>{formatMoney(property.totalSpent)}</span> : null}
                {property.lastServiceDate ? (
                  <span>Last: {formatShortDate(property.lastServiceDate)}</span>
                ) : (
                  <span>Last: —</span>
                )}
              </div>

              {property.isArchived && property.archivedAt ? (
                <p className="mt-2 text-xs text-white/60">
                  Disconnected{" "}
                  {formatDistanceToNow(new Date(property.archivedAt), {
                    addSuffix: true,
                  })}
                </p>
              ) : hasPending && property.pendingRequests?.[0]?.title ? (
                <p className="mt-2 text-xs text-white/70">
                  Pending: {property.pendingRequests[0].title}
                </p>
              ) : hasOpps ? (
                <p className="mt-2 text-xs text-white/70">Opportunities available</p>
              ) : needsAttention ? (
                <p className="mt-2 text-xs text-white/70">
                  {property.daysSinceLastService
                    ? `${property.daysSinceLastService} days since last contact`
                    : "No recent contact"}
                </p>
              ) : null}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-white/60 opacity-0 transition group-hover:opacity-100">
              <span>Open</span>
              <span aria-hidden>→</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}