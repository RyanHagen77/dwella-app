"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { glass, textMeta, ctaGhost } from "@/lib/glass";
import type { ClientRow } from "./page";

type FilterKey = "all" | "pending" | "active";
type SortKey = "newest" | "oldest" | "name" | "recent";

const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none focus:outline-none ring-0 focus:ring-0 placeholder:text-white/35";

const selectInner = fieldInner + " appearance-none pr-10";

function safeLower(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

function formatShortDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(v: number) {
  return `$${v.toFixed(2)}`;
}

export default function ContractorClientsClient({
  clients,
  initialSearch,
  initialFilter = "all",
  initialSort = "newest",
}: {
  clients: ClientRow[];
  initialSearch?: string;
  initialFilter?: FilterKey;
  initialSort?: SortKey;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const debounceRef = useRef<number | null>(null);

  const [search, setSearch] = useState(initialSearch ?? "");
  const [filter, setFilter] = useState<FilterKey>(initialFilter);
  const [sort, setSort] = useState<SortKey>(initialSort);

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
      router.push(`/pro/contractor/clients${qs ? `?${qs}` : ""}`);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, filter, sort]);

  // Search-only scope so counts don't "lie" when filter changes
  const searchScoped = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return [...clients];

    return clients.filter((c) => {
      const homeText = c.homes.map((h) => h.addressLine).join(" • ");
      return (
        safeLower(c.homeownerName).includes(t) ||
        safeLower(c.homeownerEmail).includes(t) ||
        safeLower(c.status).includes(t) ||
        safeLower(homeText).includes(t)
      );
    });
  }, [clients, search]);

  const counts = useMemo(() => {
    const pending = searchScoped.filter((c) => c.status === "Pending").length;
    const active = searchScoped.filter((c) => c.status === "Active").length;
    return { all: searchScoped.length, pending, active };
  }, [searchScoped]);

  const filtered = useMemo(() => {
    let out = [...searchScoped];

    if (filter === "pending") out = out.filter((c) => c.status === "Pending");
    if (filter === "active") out = out.filter((c) => c.status === "Active");

    return out.sort((a, b) => {
      if (sort === "name") return a.homeownerName.localeCompare(b.homeownerName);

      if (sort === "recent") {
        const ad = a.lastServiceDate ? new Date(a.lastServiceDate).getTime() : 0;
        const bd = b.lastServiceDate ? new Date(b.lastServiceDate).getTime() : 0;
        return bd - ad;
      }

      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sort === "oldest" ? -diff : diff;
    });
  }, [searchScoped, filter, sort]);

  const clearHref = useMemo(() => {
    const params = new URLSearchParams(searchParams?.toString());
    params.delete("search");
    params.delete("filter");
    params.delete("sort");
    const qs = params.toString();
    return `/pro/contractor/clients${qs ? `?${qs}` : ""}`;
  }, [searchParams]);

  const showClear = search.trim() || filter !== "all" || sort !== "newest";

  return (
    <div className="space-y-6">
      {/* Controls (same system as service records) */}
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
                placeholder="Search clients…"
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
                <option value="active" className="bg-gray-900">
                  Active ({counts.active})
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
                  Added (Newest)
                </option>
                <option value="oldest" className="bg-gray-900">
                  Added (Oldest)
                </option>
                <option value="recent" className="bg-gray-900">
                  Recent Service
                </option>
                <option value="name" className="bg-gray-900">
                  Name (A–Z)
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

      {/* Slim list-row cards */}
      <section className={glass}>
        {filtered.length === 0 ? (
          <div className="py-14 text-center">
            <p className="mb-4 text-white/70">
              {search.trim() || filter !== "all" ? "No clients match your filters." : "No clients yet."}
            </p>
            <Link href={clearHref} className={ctaGhost}>
              {search.trim() || filter !== "all" ? "Clear filters" : "Invite your first client"}
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((c) => (
              <ClientRowCard key={c.homeownerId} client={c} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ClientRowCard({ client }: { client: ClientRow }) {
  const firstAddr = client.homes[0]?.addressLine ?? "—";
  const extraHomes = Math.max(0, client.homesCount - 1);

  return (
    <li
      className={[
        "group relative overflow-hidden rounded-2xl border border-white/10",
        "bg-black/35 backdrop-blur",
        "hover:border-white/18 hover:bg-black/45 transition",
      ].join(" ")}
    >
      <Link href={`/pro/contractor/clients/${client.homeownerId}`} className="block px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-white">{client.homeownerName}</h3>

            <p className="mt-1 truncate text-xs text-white/55">
              {firstAddr}
              {extraHomes > 0 ? <span className="text-white/40"> • +{extraHomes} more</span> : null}
            </p>

            <div className={`mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${textMeta}`}>
              <span className="truncate max-w-[18rem]">{client.homeownerEmail ?? "—"}</span>
              <span className="text-white/55">
                {client.homesCount} home{client.homesCount === 1 ? "" : "s"}
              </span>
              <span className="text-white/55">{formatMoney(client.totalSpent)}</span>
              <span className="text-white/55">Last: {formatShortDate(client.lastServiceDate)}</span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-xs font-medium text-white/75">{client.status}</div>
            <div className="mt-0.5 text-[11px] text-white/50">{formatShortDate(client.createdAt)}</div>

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