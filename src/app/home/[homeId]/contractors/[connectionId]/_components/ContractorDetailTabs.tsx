"use client";

import * as React from "react";
import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { textMeta, ctaGhost, indigoActionLink } from "@/lib/glass";

type PendingServiceAttachment = {
  id: string;
  filename: string;
  mimeType: string | null;
  size: number;
  url: string | null;
};

type PendingService = {
  id: string;
  title: string;
  description: string | null;
  serviceDate: string;
  cost: number | null;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
    } | null;
  };
  createdAt: string;
  attachments: PendingServiceAttachment[];
};

type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  urgency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      verified: boolean;
      rating: number | null;
    } | null;
  };
  quote: {
    id: string;
    totalAmount: number;
    status: string;
    expiresAt: string | null;
  } | null;
  serviceRecord: {
    id: string;
    status: string;
    serviceDate: string;
  } | null;
};

type Tab = "requests" | "submissions";

type ServiceStatusFilter =
  | "ALL"
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";

/* =========================
   Shared “standard” surfaces
   ========================= */

const cardRow =
  "group relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "transition hover:bg-black/30 hover:border-white/15";

const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

/** Mobile filter button (subtle, not a big slab) */
const miniPillButton =
  "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/85 " +
  "transition-colors hover:bg-black/25 hover:border-white/25";

/** Filters (pills) */
const filterPillBase = "rounded-full border px-3 py-1 text-xs sm:text-sm";
const filterActive = "border-white/25 bg-black/35 text-white";
const filterIdle = "border-white/15 bg-black/20 text-white/70";

/* =========================
   Utils
   ========================= */

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function truncFilename(name: string) {
  if (name.length <= 28) return name;
  return name.slice(0, 18) + "…" + name.slice(-8);
}

function ChevronRight() {
  return (
    <svg
      className="h-5 w-5 text-white/35"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  );
}

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-white/55 transition-transform ${open ? "rotate-180" : ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/70">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CountBadge({ n }: { n: number }) {
  if (n <= 0) return null;
  return (
    <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/15 bg-white/10 px-1.5 text-[11px] font-semibold leading-none text-white/90">
      {n}
    </span>
  );
}

/* =========================
   Top-level tabs
   ========================= */

export function ContractorDetailTabs({
  homeId,
  pendingService,
  serviceRequests,
  requestHref,
  activeTab = "requests",
}: {
  homeId: string;
  pendingService?: PendingService[];
  serviceRequests?: ServiceRequest[];
  requestHref: string;
  activeTab?: Tab;
}) {
  const safePending = Array.isArray(pendingService) ? pendingService : [];
  const safeRequests = Array.isArray(serviceRequests) ? serviceRequests : [];

  const [tab, setTab] = useState<Tab>(activeTab);

  const totalRequests = safeRequests.length;
  const totalPendingApprovals = safePending.length;

  return (
    <div className="space-y-6">
      {/* Tabs (keep your current style) */}
      <div className="inline-flex overflow-hidden rounded-full border border-white/20 bg-white/5 p-0.5 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setTab("requests")}
          className={[
            "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
            tab === "requests"
              ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
              : "text-white/80 hover:text-white hover:bg-white/5",
          ].join(" ")}
        >
          Service Requests{totalRequests > 0 ? ` (${totalRequests})` : ""}
        </button>

        <button
          type="button"
          onClick={() => setTab("submissions")}
          className={[
            "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
            tab === "submissions"
              ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
              : "text-white/80 hover:text-white hover:bg-white/5",
          ].join(" ")}
        >
          Pending Submissions{totalPendingApprovals > 0 ? ` (${totalPendingApprovals})` : ""}
        </button>
      </div>

      {tab === "requests" ? (
        <ServiceRequestsTab serviceRequests={safeRequests} homeId={homeId} requestHref={requestHref} />
      ) : (
        <PendingServiceTab pendingService={safePending} homeId={homeId} />
      )}
    </div>
  );
}

/* =========================
   Service Requests
   ========================= */

function ServiceRequestsTab({
  serviceRequests,
  homeId,
  requestHref,
}: {
  serviceRequests: ServiceRequest[];
  homeId: string;
  requestHref: string;
}) {
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = statusFilter === "ALL" ? 0 : 1;

  const statusOptions = useMemo(
    () => [
      { label: "All", value: "ALL" },
      { label: "Pending", value: "PENDING" },
      { label: "Quoted", value: "QUOTED" },
      { label: "Accepted", value: "ACCEPTED" },
      { label: "In Progress", value: "IN_PROGRESS" },
      { label: "Completed", value: "COMPLETED" },
      { label: "Declined", value: "DECLINED" },
      { label: "Cancelled", value: "CANCELLED" },
    ],
    []
  );

  const statusCounts = useMemo(() => {
    const counts: Record<ServiceStatusFilter, number> = {
      ALL: serviceRequests.length,
      PENDING: 0,
      QUOTED: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      DECLINED: 0,
      CANCELLED: 0,
    };

    for (const r of serviceRequests) {
      const k = r.status as ServiceStatusFilter;
      if (counts[k] !== undefined) counts[k] += 1;
    }

    return counts;
  }, [serviceRequests]);

  const filtered =
    statusFilter === "ALL" ? serviceRequests : serviceRequests.filter((req) => req.status === statusFilter);

  const statusPill = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "border-orange-500/20 bg-orange-500/15 text-orange-200",
      QUOTED: "border-blue-500/20 bg-blue-500/15 text-blue-200",
      ACCEPTED: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
      IN_PROGRESS: "border-purple-500/20 bg-purple-500/15 text-purple-200",
      COMPLETED: "border-emerald-500/20 bg-emerald-500/15 text-emerald-200",
      DECLINED: "border-red-500/20 bg-red-500/15 text-red-200",
      CANCELLED: "border-white/10 bg-white/5 text-white/60",
    };

    return (
      <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-xs", styles[status] ?? styles.PENDING].join(" ")}>
        {status.replaceAll("_", " ")}
      </span>
    );
  };

  const urgencyPill = (urgency: string) => {
    const styles: Record<string, string> = {
      EMERGENCY: "border-red-600/25 bg-red-600/20 text-red-100",
      HIGH: "border-orange-500/20 bg-orange-500/15 text-orange-100",
      NORMAL: "border-blue-500/20 bg-blue-500/15 text-blue-100",
      LOW: "border-white/10 bg-white/5 text-white/60",
    };

    return (
      <span className={["inline-flex items-center rounded-full border px-2 py-0.5 text-xs", styles[urgency] ?? styles.NORMAL].join(" ")}>
        {urgency}
      </span>
    );
  };

  const leftAccentFor = (status: string) => {
    if (status === "DECLINED") return "before:bg-red-400/75";
    if (status === "CANCELLED") return "before:bg-white/12";
    if (status === "COMPLETED") return "before:bg-emerald-400/70";
    if (status === "IN_PROGRESS") return "before:bg-purple-400/70";
    if (status === "ACCEPTED") return "before:bg-emerald-400/60";
    if (status === "QUOTED") return "before:bg-blue-400/70";
    return "before:bg-orange-400/70";
  };

  return (
    <div className="space-y-4">
      {/* Top row: Request link (all sizes) + Filters button (mobile only) */}
      <div className="flex items-center justify-between gap-3">
        <Link href={requestHref} className={`${indigoActionLink} text-base`}>
          + Request service
        </Link>

        {/* Filters toggle only needed on mobile (desktop shows pills always) */}
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={`sm:hidden ${miniPillButton}`}
          aria-expanded={showFilters}
        >
          <FilterIcon />
          <span>Filters</span>

          {activeFilterCount > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-xs font-semibold text-white/90">
              {activeFilterCount}
            </span>
          ) : (
            <span className="ml-1 text-white/55">(All)</span>
          )}

          <ChevronDown open={showFilters} />
        </button>
      </div>

      {/* Filters drawer on mobile; visible on desktop */}
      <div
        className={[
          "overflow-hidden sm:overflow-visible",
          "transition-[max-height,opacity] duration-200 ease-out",
          showFilters ? "max-h-40 opacity-100" : "max-h-0 opacity-0",
          "sm:max-h-none sm:opacity-100",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center gap-2 pt-3 sm:pt-0">
          {statusOptions.map((opt) => {
            const v = opt.value as ServiceStatusFilter;
            const isActive = statusFilter === v;
            const n = statusCounts[v] ?? 0;

            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setStatusFilter(v);
                  setShowFilters(false);
                }}
                className={[filterPillBase, isActive ? filterActive : filterIdle].join(" ")}
              >
                <span>{opt.label}</span>
                <CountBadge n={n} />
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
          <p className="mb-2 text-white/80">
            {serviceRequests.length === 0 ? "No service requests yet." : "No requests match your filter."}
          </p>
          <p className={`text-sm ${textMeta}`}>Requests you send to this contractor will appear here.</p>
          <Link href={requestHref} className={`${indigoActionLink} mt-4 inline-block text-sm`}>
            + Request service
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((r) => {
            const contractorLabel =
              r.contractor.proProfile?.businessName || r.contractor.name || r.contractor.email;

            const meta: string[] = [];
            if (contractorLabel) meta.push(contractorLabel);
            if (r.category) meta.push(r.category);
            if (r.desiredDate) meta.push(`Desired: ${formatDate(r.desiredDate)}`);

            const budget =
              r.budgetMin || r.budgetMax
                ? `Budget: $${(r.budgetMin ?? 0).toLocaleString()} – $${(r.budgetMax ?? 0).toLocaleString()}`
                : null;

            return (
              <li key={r.id} className="list-none">
                <Link
                  href={`/home/${homeId}/service-requests/${r.id}`}
                  className={[
                    cardRow,
                    "block",
                    "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
                    leftAccentFor(r.status),
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4">
                    {/* icon */}
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg">
                      📋
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-base font-semibold text-white">{r.title}</h3>
                            {statusPill(r.status)}
                            {urgencyPill(r.urgency)}
                          </div>

                          {meta.length ? <p className="mt-1 truncate text-xs text-white/60">{meta.join(" • ")}</p> : null}

                          {r.description ? (
                            <p className="mt-2 line-clamp-1 text-xs text-white/65">{r.description}</p>
                          ) : null}

                          {budget ? <p className="mt-2 text-xs text-white/60">{budget}</p> : null}

                          {r.quote ? (
                            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                                Quote: ${Number(r.quote.totalAmount).toLocaleString()}
                              </span>
                              <span className="text-white/45">{r.quote.status}</span>
                            </div>
                          ) : null}

                          {r.serviceRecord ? (
                            <div className="mt-3 text-xs text-white/60">
                              Work scheduled: {formatDate(r.serviceRecord.serviceDate)} • {r.serviceRecord.status}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="hidden sm:block text-right text-xs text-white/55">
                            <div>Created</div>
                            <div>{formatDate(r.createdAt)}</div>
                          </div>
                          <ChevronRight />
                        </div>
                      </div>

                      {/* bottom meta */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
                        <span>Created {formatDate(r.createdAt)}</span>
                        {r.status !== "PENDING" ? <span>Updated {formatDate(r.updatedAt)}</span> : null}
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* =========================
   Pending Submissions (list cards + expand)
   ========================= */

function PendingServiceTab({ pendingService, homeId }: { pendingService: PendingService[]; homeId: string }) {
  const router = useRouter();
  const [openId, setOpenId] = useState<string | null>(null);

  async function handleApprove(serviceId: string) {
    try {
      const res = await fetch(`/api/home/${homeId}/completed-service-submissions/${serviceId}/approve`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to approve service");
      router.refresh();
    } catch (error) {
      console.error("Error approving service:", error);
      alert("Failed to approve service");
    }
  }

  async function handleReject(serviceId: string) {
    if (!confirm("Are you sure you want to reject this service?")) return;

    try {
      const res = await fetch(`/api/home/${homeId}/completed-service-submissions/${serviceId}/reject`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to reject service");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting service:", error);
      alert("Failed to reject service");
    }
  }

  if (pendingService.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg text-white">No services awaiting approval.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>When contractors submit completed work, it will appear here.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {pendingService.map((s) => {
        const isOpen = openId === s.id;

        const images = s.attachments.filter((a) => a.mimeType?.startsWith("image/"));
        const docs = s.attachments.filter((a) => a.mimeType && !a.mimeType.startsWith("image/"));

        const contractorLabel =
          s.contractor.proProfile?.businessName || s.contractor.name || s.contractor.email;

        const meta: string[] = [];
        if (s.serviceDate) meta.push(`Work date: ${formatDate(s.serviceDate)}`);
        if (s.cost != null) meta.push(`Cost: $${Number(s.cost).toLocaleString()}`);
        if (s.attachments?.length) meta.push(`Attachments: ${s.attachments.length}`);

        return (
          <li key={s.id} className="list-none">
            <div
              className={[
                cardRow,
                "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full before:bg-yellow-400/75",
              ].join(" ")}
            >
              <button
                type="button"
                onClick={() => setOpenId((cur) => (cur === s.id ? null : s.id))}
                className="w-full text-left"
                aria-expanded={isOpen}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg">
                    ✅
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold text-white">{s.title}</h3>
                          <span className="inline-flex items-center rounded-full border border-yellow-400/25 bg-yellow-400/10 px-2 py-0.5 text-xs text-yellow-100">
                            Pending review
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs text-white/60">
                          By: {contractorLabel}
                          {meta.length ? ` • ${meta.join(" • ")}` : ""}
                        </p>

                        {s.description ? (
                          <p className="mt-2 line-clamp-1 text-xs text-white/65">{s.description}</p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="hidden sm:block text-right text-xs text-white/55">
                          <div>Submitted</div>
                          <div>{formatDate(s.createdAt)}</div>
                        </div>
                        <ChevronDown open={isOpen} />
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
                      <span>Submitted {formatDate(s.createdAt)}</span>
                      {s.serviceDate ? <span>Work {formatDate(s.serviceDate)}</span> : null}
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              <div
                className={[
                  "overflow-hidden",
                  "transition-[max-height,opacity] duration-200 ease-out",
                  isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0",
                ].join(" ")}
              >
                <div className="pt-4">
                  {s.description ? (
                    <div className={insetSurface}>
                      <p className="whitespace-pre-wrap text-sm text-white/85">{s.description}</p>
                    </div>
                  ) : null}

                  {s.attachments.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      {images.length > 0 ? (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                            Photos ({images.length})
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                            {images.map((a) => {
                              const href = `/api/home/${homeId}/attachments/${a.id}`;
                              return (
                                <a
                                  key={a.id}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                                >
                                  <Image
                                    src={href}
                                    alt={a.filename}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                    className="object-cover"
                                  />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {docs.length > 0 ? (
                        <div>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                            Documents ({docs.length})
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {docs.map((a) => {
                              const href = `/api/home/${homeId}/attachments/${a.id}`;
                              const sizeKb = a.size ? (Number(a.size) / 1024).toFixed(1) : null;

                              return (
                                <a
                                  key={a.id}
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:bg-black/25"
                                >
                                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                                    <span className="text-lg">{a.mimeType?.includes("pdf") ? "📄" : "📎"}</span>
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="truncate text-sm font-medium text-white">{truncFilename(a.filename)}</div>
                                    <div className="text-xs text-white/60">
                                      {a.mimeType ?? "Document"}
                                      {sizeKb ? ` • ${sizeKb} KB` : ""}
                                    </div>
                                  </div>

                                  <span className={ctaGhost}>Open</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleApprove(s.id)}
                      className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/15 hover:border-emerald-300/35"
                    >
                      ✓ Approve &amp; add to records
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleReject(s.id)}
                      className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}