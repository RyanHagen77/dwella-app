"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
  attachments: Array<{
    id: string;
    filename: string;
    url: string; // ✅ always string now
    mimeType: string | null;
    size: number | null;
    uploadedBy: string;
  }>;
};

type Props = {
  warranties: WarrantyItem[];
  homeId: string;
  initialSearch?: string;
  initialSort?: string;
};

type SortKey = "soonest" | "latest" | "item";

const filterSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";

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

function statusDotClass(w: WarrantyItem) {
  if (w.isExpired) return "bg-red-400";
  if (w.isExpiringSoon) return "bg-yellow-400";
  if (w.expiresAt) return "bg-emerald-400";
  return "bg-white/30";
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

export function WarrantiesPageClient({ warranties, homeId, initialSearch, initialSort }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch ?? "");
  const [sort, setSort] = useState<SortKey>((initialSort as SortKey) ?? "soonest");

  // Debounce URL updates
  const debounceRef = useRef<number | null>(null);

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
    // If searching, "clear search"; else go back to home (or keep on warranties)
    if (!search.trim()) return `/home/${homeId}`;
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("search");
    const qs = params.toString();
    return `/home/${homeId}/warranties${qs ? `?${qs}` : ""}`;
  }, [homeId, search, searchParams]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className={filterSurface}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">Search</label>
            <div className="rounded-2xl border border-white/12 bg-black/20 px-4 py-2">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search warranties…"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">Sort</label>
            <div className="relative rounded-2xl border border-white/12 bg-black/20 px-4 py-2">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full appearance-none bg-transparent pr-8 text-sm text-white outline-none"
              >
                <option value="soonest">Expiring Soonest</option>
                <option value="latest">Expiring Latest</option>
                <option value="item">Item (A–Z)</option>
              </select>

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
            </div>
          </div>
        </div>
      </section>

      {/* List */}
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
            <WarrantyCard key={w.id} warranty={w} homeId={homeId} />
          ))}
        </ul>
      )}
    </div>
  );
}

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

  const metaParts: string[] = [];
  if (warranty.provider) metaParts.push(warranty.provider);
  if (warranty.policyNo) metaParts.push(`Policy ${warranty.policyNo}`);

  const leftAccent = warranty.isExpired
    ? "before:bg-red-400/80"
    : warranty.isExpiringSoon
    ? "before:bg-yellow-400/80"
    : warranty.expiresAt
    ? "before:bg-emerald-400/70"
    : "before:bg-white/15";

  return (
    <>
      <li className="list-none">
        <div
          className={[
            "group relative overflow-hidden rounded-2xl border border-white/12 bg-black/25 transition",
            "hover:border-white/18 hover:bg-black/30",
            "before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:rounded-full",
            leftAccent,
          ].join(" ")}
        >
          <Link href={`/home/${homeId}/warranties/${warranty.id}`} className="block px-5 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusDotClass(warranty)}`} />
                  <h3 className="truncate text-[15px] font-semibold text-white">{warranty.item}</h3>
                </div>

                {metaParts.length > 0 ? (
                  <p className="mt-1 truncate text-xs text-white/55">{metaParts.join(" • ")}</p>
                ) : null}

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

              <div className="shrink-0 text-right">
                <div className={`text-xs font-medium ${statusTextClass(warranty)}`}>{expiryLabel(warranty)}</div>
                <div className="mt-0.5 text-[11px] text-white/50">{warranty.formattedExpiry}</div>

                {/* Actions appear on hover/focus */}
                <div className="mt-2 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
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
        </div>
      </li>

      <EditWarrantyModal open={editOpen} onClose={() => setEditOpen(false)} warranty={warranty as any} homeId={homeId} />
    </>
  );
}