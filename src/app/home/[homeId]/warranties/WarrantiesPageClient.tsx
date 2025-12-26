// src/app/home/[homeId]/warranties/WarrantiesPageClient.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import AddRecordButton from "@/app/home/_components/AddRecordButton";
import { glass, heading, indigoActionLink, textMeta } from "@/lib/glass";
import { EditWarrantyModal } from "./_components/EditWarrantyModal";

export type WarrantyItem = {
  id: string;
  item: string;
  provider: string | null;
  policyNo: string | null;
  expiresAt: string | Date | null;
  note: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysUntilExpiry: number;
  formattedExpiry: string;
  attachments: {
    id: string;
    filename: string;
    url: string;
    mimeType: string | null;
    size: number | null;
    uploadedBy: string;
  }[];
};

type Props = {
  warranties: WarrantyItem[];
  homeId: string;
  initialSearch?: string;
  initialSort?: string;

  activeCount: number;
  expiringSoonCount: number;
  expiredCount: number;
  totalCount: number;
};

type SortKey = "soonest" | "latest" | "item";

/** Match ContractorsListClient */
const cardLink =
  "group relative block overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "transition hover:bg-black/30 hover:border-white/15";

/** Tight + consistent filter slab */
const filterSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

/** Clean glass controls: NO rings, focus via border only */
const fieldShell =
  "rounded-2xl border border-white/25 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

const fieldInner =
  "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none";

const inputInner = `${fieldInner} px-4 py-2`;
const selectInner = `${fieldInner} px-4 py-2 pr-9 appearance-none`;
const labelCaps = "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

function expiryLabel(w: WarrantyItem) {
  if (!w.expiresAt) return "No expiry";
  if (w.isExpired) {
    const d = Math.abs(w.daysUntilExpiry);
    if (d === 0) return "Expired today";
    if (d === 1) return "Expired 1 day ago";
    return `Expired ${d} days ago`;
  }
  if (w.daysUntilExpiry === 0) return "Expires today";
  if (w.daysUntilExpiry === 1) return "Expires tomorrow";
  return `Expires in ${w.daysUntilExpiry} days`;
}

function statusTextClass(w: WarrantyItem) {
  if (w.isExpired) return "text-red-300";
  if (w.isExpiringSoon) return "text-yellow-300";
  if (w.expiresAt) return "text-emerald-200";
  return "text-white/60";
}

function truncFilename(name: string) {
  if (name.length <= 28) return name;
  return name.slice(0, 18) + "…" + name.slice(-8);
}

export function WarrantiesPageClient({
  warranties,
  homeId,
  initialSearch,
  initialSort,
  activeCount,
  expiringSoonCount,
  expiredCount,
  totalCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch ?? "");
  const [sort, setSort] = useState<SortKey>((initialSort as SortKey) ?? "soonest");

  // ✅ parity with Contractors/Reminders: collapsed by default on mobile, visible on desktop
  const [isExpanded, setIsExpanded] = useState(false);

  const debounceRef = useRef<number | null>(null);

  // URL sync (routes unchanged)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());

      const s = search.trim();
      if (s) params.set("search", s);
      else params.delete("search");

      if (sort !== "soonest") params.set("sort", sort);
      else params.delete("sort");

      const qs = params.toString();
      router.push(`/home/${homeId}/warranties${qs ? `?${qs}` : ""}`);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, sort, homeId]);

  const emptyHref = useMemo(() => {
    if (!search.trim()) return `/home/${homeId}`;
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("search");
    const qs = params.toString();
    return `/home/${homeId}/warranties${qs ? `?${qs}` : ""}`;
  }, [homeId, search, searchParams]);

  // Indigo action link styling (no slab/hover)
const IndigoAddWarranty = (  // or IndigoAddReminder
  <span
    className={[
      "[&_button]:!bg-transparent [&_button:hover]:!bg-transparent",
      "[&_button]:!border-0 [&_button]:!shadow-none [&_button:hover]:!shadow-none",
      "[&_button]:!p-0 [&_button]:!rounded-none",
      "[&_button]:!text-base",  // ← Control size here (text-sm, text-base, text-lg, etc.)
      "[&_button]:!font-medium",
      "[&_button]:!text-indigo-300 [&_button:hover]:!text-indigo-200",
      "[&_button]:inline-flex [&_button]:items-center",
    ].join(" ")}
  >
    <AddRecordButton homeId={homeId} label="Add warranty" defaultType="warranty" />
  </span>
);

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* ✅ Overview (match Contractors/Reminders) */}
      <section aria-labelledby="warranty-stats" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 text-left lg:cursor-default"
          >
            <h2 id="warranty-stats" className={`text-lg font-semibold ${heading}`}>
              Overview
            </h2>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform lg:hidden ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {IndigoAddWarranty}
        </div>

        <div className={`${isExpanded ? "grid" : "hidden"} grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4`}>
          <StatTile label="Active" value={activeCount} />
          <StatTile label="Expiring Soon" value={expiringSoonCount} />
          <StatTile label="Expired" value={expiredCount} />
          <StatTile label="Total" value={totalCount} />
        </div>
      </section>

      {/* ✅ Filters (UPDATED borders; no rings) */}
      <section className={filterSurface}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <div className="sm:col-span-2">
            <label className={labelCaps}>Search</label>
            <div className={fieldShell}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search warranties…"
                className={inputInner}
              />
            </div>
          </div>

          <div>
            <label className={labelCaps}>Sort</label>
            <div className={`relative ${fieldShell}`}>
              <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={selectInner}>
                <option value="soonest">Expiring Soonest</option>
                <option value="latest">Expiring Latest</option>
                <option value="item">Item (A–Z)</option>
              </select>
              <Chevron />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ List */}
      {warranties.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="mb-3 text-white/80">
            {search.trim() ? "No warranties match your search." : "No warranties yet for this home."}
          </p>
          <Link
            href={emptyHref}
            className="inline-flex rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
          >
            {search.trim() ? "Clear search" : "Back to home"}
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {warranties.map((w) => (
            <li key={w.id} className="list-none">
              <WarrantyCard warranty={w} homeId={homeId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Contractors-style overview tiles ---------- */

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${glass} p-4`} title={label}>
      <p className={`text-xs ${textMeta} whitespace-nowrap`}>{label}</p>
      <p className="mt-2 text-lg lg:text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* ---------- Contractors-style list row ---------- */

function WarrantyCard({ warranty, homeId }: { warranty: WarrantyItem; homeId: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/warranties/${warranty.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete warranty");
      router.refresh();
    } catch (e) {
      console.error(e);
      alert("Failed to delete warranty. Please try again.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const href = `/home/${homeId}/warranties/${warranty.id}`;

  const statusLabel = warranty.isExpired
    ? "Expired"
    : warranty.isExpiringSoon
    ? "Expiring Soon"
    : warranty.expiresAt
    ? "Active"
    : "No expiry";

  const statusPill =
    warranty.isExpired
      ? "border-red-400/25 bg-red-400/10 text-red-100"
      : warranty.isExpiringSoon
      ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-100"
      : warranty.expiresAt
      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
      : "border-white/10 bg-white/5 text-white/60";

  const leftAccent =
    warranty.isExpired
      ? "before:bg-red-400/80"
      : warranty.isExpiringSoon
      ? "before:bg-yellow-400/80"
      : warranty.expiresAt
      ? "before:bg-emerald-400/70"
      : "before:bg-white/12";

  const meta: string[] = [];
  if (warranty.provider) meta.push(warranty.provider);
  if (warranty.policyNo) meta.push(`Policy ${warranty.policyNo}`);
  if (warranty.expiresAt) meta.push(`Expiry: ${warranty.formattedExpiry}`);
  if (warranty.attachments?.length) meta.push(`Attachments: ${warranty.attachments.length}`);

  return (
    <>
      <Link
        href={href}
        className={[
          cardLink,
          "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
          leftAccent,
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg">
            🧾
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-white">{warranty.item}</h3>

                  <span
                    className={[
                      "inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-xs",
                      statusPill,
                    ].join(" ")}
                  >
                    {statusLabel}
                  </span>
                </div>

                {meta.length ? <p className="mt-1 truncate text-xs text-white/60">{meta.join(" • ")}</p> : null}

                {warranty.note ? <p className="mt-2 line-clamp-1 text-xs text-white/65">{warranty.note}</p> : null}

                {warranty.attachments?.length ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-white/45">📎 {warranty.attachments.length}</span>
                    {warranty.attachments.slice(0, 2).map((att) => (
                      <span
                        key={att.id}
                        className="max-w-[260px] truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60"
                        title={att.filename}
                      >
                        {truncFilename(att.filename)}
                      </span>
                    ))}
                    {warranty.attachments.length > 2 ? (
                      <span className="text-[11px] text-white/45">+{warranty.attachments.length - 2} more</span>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="flex items-center text-white/35" aria-hidden>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
              <span className={statusTextClass(warranty)}>{expiryLabel(warranty)}</span>
              {warranty.note ? <span className="truncate max-w-[520px]">Note: {warranty.note}</span> : null}
            </div>

            <div className="mt-3 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditOpen(true);
                }}
              >
                Edit
              </button>

              <button
                type="button"
                disabled={deleting}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-60",
                  confirmDelete
                    ? "border-red-400/45 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                    : "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/20",
                ].join(" ")}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
                    confirmTimerRef.current = window.setTimeout(() => setConfirmDelete(false), 2500);
                    return;
                  }

                  void handleDelete();
                }}
              >
                {deleting ? "Deleting…" : confirmDelete ? "Confirm?" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Link>

      <EditWarrantyModal open={editOpen} onClose={() => setEditOpen(false)} warranty={warranty as any} homeId={homeId} />
    </>
  );
}