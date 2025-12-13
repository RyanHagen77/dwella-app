"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { glass, textMeta, ctaGhost } from "@/lib/glass";

type ServiceRecord = {
  id: string;
  homeId: string;
  homeAddress: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  homeownerName: string;
  serviceType: string;
  serviceDate: string;
  cost: number | null;
  status: string;
  isVerified: boolean;
  description: string | null;
  photos: string[];
  createdAt: string;
};

type FilterKey = "all" | "pending" | "verified";
type SortKey = "newest" | "oldest" | "created" | "type";

type ContractorServiceRecordsClientProps = {
  serviceRecords?: ServiceRecord[] | null;
  initialSearch?: string;
  initialFilter?: FilterKey;
  initialSort?: SortKey;
};

function safeLower(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

function formatShortDate(iso: string) {
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

function leftAccent(record: ServiceRecord) {
  // Pending amber, verified emerald
  return record.isVerified ? "before:bg-emerald-400/70" : "before:bg-amber-400/70";
}

function statusDotClass(record: ServiceRecord) {
  return record.isVerified ? "bg-emerald-400" : "bg-yellow-400";
}

function statusTextClass(record: ServiceRecord) {
  return record.isVerified ? "text-emerald-200" : "text-yellow-300";
}

/**
 * Controls styling:
 * We wrap input/select in a "shell" so the border is guaranteed
 * around the whole field (instead of relying on native select rendering).
 */
const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/35";

const selectInner =
  fieldInner +
  " appearance-none pr-10 outline-none focus:outline-none ring-0 focus:ring-0";

export default function ContractorServiceRecordsClient({
  serviceRecords,
  initialSearch,
  initialFilter = "all",
  initialSort = "newest",
}: ContractorServiceRecordsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<number | null>(null);

  const list = serviceRecords ?? [];

  const [search, setSearch] = useState(initialSearch ?? "");
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [sort, setSort] = useState<SortKey>(initialSort);

  // Debounce URL updates (warranties-style)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());

      const s = search.trim();
      if (s) params.set("search", s);
      else params.delete("search");

      if (filter !== "all") params.set("filter", filter);
      else params.delete("filter");

      if (sort !== "newest") params.set("sort", sort);
      else params.delete("sort");

      const qs = params.toString();
      router.push(`/pro/contractor/service-records${qs ? `?${qs}` : ""}`);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, sort]);

  /**
   * IMPORTANT:
   * Counts should NOT depend on which filter is currently selected.
   * They should reflect the current search only.
   */
  const searchScoped = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return [...list];

    return list.filter((r) => {
      const addr = `${r.homeAddress}${r.city ? `, ${r.city}` : ""}${r.state ? `, ${r.state}` : ""}`;
      return (
        safeLower(r.serviceType).includes(t) ||
        safeLower(r.description).includes(t) ||
        safeLower(r.homeownerName).includes(t) ||
        safeLower(addr).includes(t) ||
        safeLower(r.city).includes(t) ||
        safeLower(r.state).includes(t)
      );
    });
  }, [list, search]);

  const counts = useMemo(() => {
    const pending = searchScoped.filter((r) => !r.isVerified).length;
    const verified = searchScoped.filter((r) => r.isVerified).length;
    return { all: searchScoped.length, pending, verified };
  }, [searchScoped]);

  const filtered = useMemo(() => {
    let out = [...searchScoped];

    if (filter === "pending") out = out.filter((r) => !r.isVerified);
    if (filter === "verified") out = out.filter((r) => r.isVerified);

    // Sort (but always keep "pending first" regardless)
    return out.sort((a, b) => {
      if (!a.isVerified && b.isVerified) return -1;
      if (a.isVerified && !b.isVerified) return 1;

      if (sort === "type") return a.serviceType.localeCompare(b.serviceType);
      if (sort === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }

      const diff = new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
      return sort === "oldest" ? -diff : diff; // newest default
    });
  }, [searchScoped, filter, sort]);

  const clearHref = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("search");
    params.delete("filter");
    params.delete("sort");
    const qs = params.toString();
    return `/pro/contractor/service-records${qs ? `?${qs}` : ""}`;
  }, [searchParams]);

  const showClear = search.trim() || filter !== "all" || sort !== "newest";

  return (
    <div className="space-y-6">
      {/* Controls */}
      <section className={glass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Search
            </label>
            <div className={fieldShell}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search service records…"
                className={fieldInner}
              />
            </div>
          </div>

          <div className="w-full md:w-56">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
              Filter
            </label>
            <div className={`${fieldShell} relative`}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterKey)}
                className={selectInner}
              >
                <option value="all" className="bg-gray-900">
                  All ({counts.all})
                </option>
                <option value="pending" className="bg-gray-900">
                  Pending ({counts.pending})
                </option>
                <option value="verified" className="bg-gray-900">
                  Verified ({counts.verified})
                </option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                ▾
              </span>
            </div>
          </div>

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
                <option value="newest" className="bg-gray-900">
                  Service Date (Newest)
                </option>
                <option value="oldest" className="bg-gray-900">
                  Service Date (Oldest)
                </option>
                <option value="created" className="bg-gray-900">
                  Created (Latest)
                </option>
                <option value="type" className="bg-gray-900">
                  Service Type (A–Z)
                </option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/50">
                ▾
              </span>
            </div>
          </div>

          {showClear ? (
            <div className="flex md:justify-end">
              <Link href={clearHref} className={ctaGhost}>
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
            <p className="mb-4 text-white/70">
              {search.trim() || filter !== "all"
                ? "No service records match your filters."
                : "No service records yet."}
            </p>
            <Link href={clearHref} className={ctaGhost}>
              {search.trim() || filter !== "all" ? "Clear filters" : "Start documenting service"}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((r) => (
              <ServiceRecordCard key={r.id} record={r} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ServiceRecordCard({ record }: { record: ServiceRecord }) {
  const addrLine = `${record.homeAddress}${record.city ? `, ${record.city}` : ""}${
    record.state ? `, ${record.state}` : ""
  }`;

  return (
    <li
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/10",
        "bg-black/35 backdrop-blur",
        "hover:border-white/18 hover:bg-black/45 transition",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
        leftAccent(record),
      ].join(" ")}
    >
      <Link href={`/pro/contractor/service-records/${record.id}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(record)}`} />
              <h3 className="truncate text-[15px] font-semibold text-white">{record.serviceType}</h3>
            </div>

            <p className="mt-1 truncate text-xs text-white/55">{addrLine}</p>

            <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${textMeta}`}>
              <span className="inline-flex items-center gap-2">
                <span className="text-white/60">👤</span>
                <span className="truncate max-w-[18rem]">{record.homeownerName || "Unclaimed"}</span>
              </span>

              <span className="inline-flex items-center gap-2">
                <span className="text-white/60">📅</span>
                <span>{formatShortDate(record.serviceDate)}</span>
              </span>

              {record.cost != null && (
                <span className="inline-flex items-center gap-2">
                  <span className="text-white/60">💰</span>
                  <span>{formatMoney(record.cost)}</span>
                </span>
              )}
            </div>

            {record.description && (
              <p className="mt-2 line-clamp-1 text-xs text-white/65">
                {record.description}
              </p>
            )}

            {record.photos?.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[11px] text-white/45">📷 {record.photos.length}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-right">
            <div className={`text-xs font-medium ${statusTextClass(record)}`}>
              {record.isVerified ? "Verified" : "Pending"}
            </div>
            <div className="mt-0.5 text-[11px] text-white/50">
              {formatShortDate(record.createdAt)}
            </div>

            <div className="mt-2 inline-flex items-center gap-1 text-xs text-white/60 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <span>Open</span>
              <span aria-hidden>→</span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}