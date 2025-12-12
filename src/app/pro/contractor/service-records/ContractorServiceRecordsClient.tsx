"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { glass, glassTight, heading, textMeta, ctaPrimary } from "@/lib/glass";
import { Input } from "@/components/ui";
import { InviteHomeownerButton } from "@/app/pro/_components/InviteHomeownerButton";

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

type ContractorServiceRecordsClientProps = {
  serviceRecords: ServiceRecord[];
};

type Filter = "all" | "pending" | "verified";

function formatMoney(v: number) {
  // Keep it simple: you can swap to Intl later if you want
  return `$${v.toFixed(2)}`;
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function safeLower(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

export default function ContractorServiceRecordsClient({
  serviceRecords,
}: ContractorServiceRecordsClientProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const counts = useMemo(() => {
    const pending = serviceRecords.filter((r) => !r.isVerified).length;
    const verified = serviceRecords.filter((r) => r.isVerified).length;
    return { all: serviceRecords.length, pending, verified };
  }, [serviceRecords]);

  const filtered = useMemo(() => {
    let list = [...serviceRecords];

    if (filter === "pending") list = list.filter((r) => !r.isVerified);
    if (filter === "verified") list = list.filter((r) => r.isVerified);

    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((r) => {
        return (
          safeLower(r.serviceType).includes(t) ||
          safeLower(r.homeAddress).includes(t) ||
          safeLower(r.homeownerName).includes(t) ||
          safeLower(r.city).includes(t) ||
          safeLower(r.state).includes(t)
        );
      });
    }

    // Pending first, then newest service date
    return list.sort((a, b) => {
      if (!a.isVerified && b.isVerified) return -1;
      if (a.isVerified && !b.isVerified) return 1;
      return new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime();
    });
  }, [serviceRecords, q, filter]);

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className={glass + " rounded-2xl px-4 py-4 sm:px-6 sm:py-5"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className={`text-2xl font-semibold ${heading}`}>Service Records</h1>
            <p className={`mt-1 text-sm ${textMeta}`}>
              Track documented work across properties — even if the homeowner isn’t connected.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Pill label={`${counts.all} total`} />
              <Pill label={`${counts.pending} pending`} tone="amber" />
              <Pill label={`${counts.verified} verified`} tone="emerald" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link href="/pro/contractor/service-records/new" className={ctaPrimary}>
              + Document Service
            </Link>
            <InviteHomeownerButton />
          </div>
        </div>
      </div>

      {/* Filters + search */}
      <section className={glass + " rounded-2xl px-4 py-4 sm:px-6"}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All <span className="text-white/60">({counts.all})</span>
            </Chip>
            <Chip active={filter === "pending"} onClick={() => setFilter("pending")}>
              Pending <span className="text-white/60">({counts.pending})</span>
            </Chip>
            <Chip active={filter === "verified"} onClick={() => setFilter("verified")}>
              Verified <span className="text-white/60">({counts.verified})</span>
            </Chip>
          </div>

          <div className="w-full sm:w-80">
            <Input placeholder="Search service records..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
      </section>

      {/* List */}
      <section className={glass + " rounded-2xl px-2 py-2 sm:px-3 sm:py-3"}>
        {filtered.length === 0 ? (
          <EmptyState
            q={q}
            filter={filter}
            onClear={() => {
              setQ("");
              setFilter("all");
            }}
          />
        ) : (
          <ul className="space-y-2">
            {filtered.map((record) => (
              <ServiceRecordCard key={record.id} record={record} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ----------------------------- pieces ----------------------------- */

function ServiceRecordCard({ record }: { record: ServiceRecord }) {
  const addrLine = `${record.homeAddress}${record.city ? `, ${record.city}` : ""}${record.state ? `, ${record.state}` : ""}`;

  return (
    <li>
      <Link
        href={`/pro/contractor/service-records/${record.id}`}
        className={
          glassTight +
          " group block rounded-2xl px-4 py-4 sm:px-5 sm:py-5 transition " +
          "hover:bg-white/10 hover:border-white/20 hover:-translate-y-[1px]"
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="min-w-0 truncate text-base font-semibold text-white">
                {record.serviceType}
              </h3>
              <StatusBadge status={record.status} isVerified={record.isVerified} />
            </div>

            <div className={`mt-2 flex flex-col gap-1 text-sm ${textMeta}`}>
              <div className="flex items-center gap-2">
                <span className="text-white/60">🏠</span>
                <span className="truncate">{addrLine}</span>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-2">
                  <span className="text-white/60">👤</span>
                  <span className="truncate max-w-[18rem]">
                    {record.homeownerName || "Unclaimed"}
                  </span>
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
            </div>

            {record.description && (
              <p className={`mt-3 line-clamp-2 text-sm ${textMeta}`}>
                {record.description}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              {record.photos.length > 0 && (
                <Pill label={`📷 ${record.photos.length} photo${record.photos.length === 1 ? "" : "s"}`} />
              )}
              {/* Add other quick stats here later (invoice/warranty counts) */}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className={`text-xs ${textMeta}`}>{formatShortDate(record.createdAt)}</div>
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

function StatusBadge({ status, isVerified }: { status: string; isVerified: boolean }) {
  if (isVerified) {
    return (
      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
        VERIFIED
      </span>
    );
  }

  const map: Record<string, { label: string; cls: string }> = {
    DOCUMENTED_UNVERIFIED: {
      label: "Pending verification",
      cls: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    },
    DOCUMENTED: {
      label: "Awaiting review",
      cls: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    },
    DISPUTED: {
      label: "Disputed",
      cls: "border-red-400/40 bg-red-500/15 text-red-200",
    },
  };

  const cfg = map[status] || {
    label: status,
    cls: "border-white/25 bg-white/10 text-white/80",
  };

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-3 py-1.5 text-sm transition " +
        (active
          ? "border-white/40 bg-white/15 text-white"
          : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white")
      }
    >
      {children}
    </button>
  );
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "amber" | "emerald" }) {
  const cls =
    tone === "amber"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
      : tone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : "border-white/20 bg-white/5 text-white/75";

  return <span className={`rounded-full border px-2 py-1 text-[11px] font-medium ${cls}`}>{label}</span>;
}

function EmptyState({
  q,
  filter,
  onClear,
}: {
  q: string;
  filter: "all" | "pending" | "verified";
  onClear: () => void;
}) {
  const hasFilters = Boolean(q.trim()) || filter !== "all";

  return (
    <div className="px-4 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-2xl">
        📋
      </div>
      <p className="text-base font-semibold text-white">No service records found</p>
      <p className={`mt-1 text-sm ${textMeta}`}>
        {hasFilters
          ? "Try clearing your search or filters."
          : "Start documenting completed service for any property you work on."}
      </p>

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
        >
          Clear filters
        </button>
      ) : (
        <Link href="/pro/contractor/service-records/new" className={ctaPrimary + " mt-4 inline-flex"}>
          + Document Service
        </Link>
      )}
    </div>
  );
}