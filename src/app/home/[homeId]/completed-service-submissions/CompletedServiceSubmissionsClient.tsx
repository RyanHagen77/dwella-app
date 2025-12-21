"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";

type Connection = {
  id: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      verified: boolean;
    } | null;
  };
  createdAt: string;
};

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

/* darker surfaces */
const pillBase = "rounded-full border px-4 py-2 text-sm";
const pillActive = "border-white/25 bg-black/35 text-white";
const pillIdle = "border-white/15 bg-black/20 text-white/80";

const filterPillBase = "rounded-full border px-3 py-1 text-xs sm:text-sm";
const filterActive = "border-white/25 bg-black/35 text-white";
const filterIdle = "border-white/15 bg-black/20 text-white/70";

const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";
const cardLink = `${cardSurface} block`;

const miniPillButton =
  "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/85 " +
  "transition-colors hover:bg-black/25 hover:border-white/25";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function FilterIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/70">
      <path d="M4 6h16M7 12h10M10 18h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function CompletedServiceSubmissionsClient({
  homeId,
  pendingService,
  serviceRequests,
  requestHref,
}: {
  homeId: string;
  homeAddress: string;
  connections: Connection[];
  pendingService: PendingService[];
  serviceRequests: ServiceRequest[];
  requestHref: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("requests");

  const totalRequests = serviceRequests.length;
  const totalPendingApprovals = pendingService.length;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={[pillBase, activeTab === "requests" ? pillActive : pillIdle].join(" ")}
        >
          Service Requests{totalRequests > 0 ? ` (${totalRequests})` : ""}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("submissions")}
          className={[pillBase, activeTab === "submissions" ? pillActive : pillIdle].join(" ")}
        >
          Pending Submissions{totalPendingApprovals > 0 ? ` (${totalPendingApprovals})` : ""}
        </button>
      </div>

      {/* Content */}
      {activeTab === "requests" ? (
        <ServiceRequestsTab serviceRequests={serviceRequests} homeId={homeId} requestHref={requestHref} />
      ) : (
        <PendingServiceTab pendingService={pendingService} homeId={homeId} />
      )}
    </div>
  );
}

/* ---------- Service Requests Tab ---------- */

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

  // Filters button badge count (how many filters are “active”)
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

  // ✅ NEW: count items per status for pill badges
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
    statusFilter === "ALL"
      ? serviceRequests
      : serviceRequests.filter((req) => req.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-orange-500/15 text-orange-200 border-orange-500/20",
      QUOTED: "bg-blue-500/15 text-blue-200 border-blue-500/20",
      ACCEPTED: "bg-green-500/15 text-green-200 border-green-500/20",
      IN_PROGRESS: "bg-purple-500/15 text-purple-200 border-purple-500/20",
      COMPLETED: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
      DECLINED: "bg-red-500/15 text-red-200 border-red-500/20",
      CANCELLED: "bg-gray-500/15 text-gray-200 border-gray-500/20",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
          styles[status] ?? styles.PENDING
        }`}
      >
        {status.replaceAll("_", " ")}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles: Record<string, string> = {
      EMERGENCY: "bg-red-600/20 text-red-100 border border-red-600/25",
      HIGH: "bg-orange-500/15 text-orange-100 border border-orange-500/20",
      NORMAL: "bg-blue-500/15 text-blue-100 border border-blue-500/20",
      LOW: "bg-gray-500/15 text-gray-100 border border-gray-500/20",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${styles[urgency] ?? styles.NORMAL}`}
      >
        {urgency}
      </span>
    );
  };

  const CountBadge = ({ n }: { n: number }) =>
    n > 0 ? (
      <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/15 bg-white/10 px-1.5 text-[11px] font-semibold leading-none text-white/90">
        {n}
      </span>
    ) : null;

  return (
    <div className="space-y-4">
      {/* Mobile row: Request + Filters (same line) */}
      <div className="flex items-center justify-between gap-3 sm:hidden">
        <Link href={requestHref} className={ctaPrimary}>
          + Request Service
        </Link>

        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className={miniPillButton}
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

          <span className="ml-1 text-white/55">{showFilters ? "▴" : "▾"}</span>
        </button>
      </div>

      {/* Animated filters drawer on mobile; always visible on desktop */}
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
                  setShowFilters(false); // mobile: choose -> collapse
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

      {serviceRequests.length === 0 ? (
        <div className="py-10 text-center">
          <div className="mb-4 text-5xl">📋</div>
          <p className="text-lg text-white">No service requests yet.</p>
          <p className={`mt-2 text-sm ${textMeta}`}>Request work from your connected pros to get started.</p>
          <Link href={requestHref} className={`${ctaPrimary} mt-4 inline-block`}>
            + Request Service
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((service) => (
            <Link key={service.id} href={`/home/${homeId}/service-requests/${service.id}`} className={cardLink}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-white sm:text-lg">{service.title}</h3>
                    {getStatusBadge(service.status)}
                    {getUrgencyBadge(service.urgency)}
                  </div>

                  <p className="text-sm text-white/70 line-clamp-2">{service.description}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
                    {service.contractor.image ? (
                      <Image
                        src={service.contractor.image}
                        alt={service.contractor.name || service.contractor.email}
                        width={24}
                        height={24}
                        className="h-6 w-6 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full border border-white/10 bg-black/20" />
                    )}

                    <span className="truncate">
                      {service.contractor.proProfile?.businessName || service.contractor.name || service.contractor.email}
                    </span>

                    {service.category ? <span>• {service.category}</span> : null}
                    {service.desiredDate ? <span>• Desired: {formatDate(service.desiredDate)}</span> : null}
                  </div>

                  {service.budgetMin || service.budgetMax ? (
                    <div className="mt-2 text-sm text-white/60">
                      Budget: ${service.budgetMin?.toLocaleString() || "0"} – $
                      {service.budgetMax?.toLocaleString() || "0"}
                    </div>
                  ) : null}

                  {service.quote ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-xs font-medium text-white/70">Quote received</div>
                          <div className="mt-1 text-lg font-semibold text-white">
                            ${Number(service.quote.totalAmount).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-xs text-white/60">{service.quote.status}</div>
                      </div>
                    </div>
                  ) : null}

                  {service.serviceRecord ? (
                    <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-xs font-medium text-white/70">Work scheduled</div>
                      <div className="mt-1 text-sm text-white/80">
                        {formatDate(service.serviceRecord.serviceDate)} • {service.serviceRecord.status}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="shrink-0 text-xs text-white/55 sm:text-right">
                  <div>Created: {formatDate(service.createdAt)}</div>
                  {service.status !== "PENDING" ? (
                    <div className="mt-1">Updated: {formatDate(service.updatedAt)}</div>
                  ) : null}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Pending Submissions Tab (unchanged) ---------- */

function PendingServiceTab({
  pendingService,
  homeId,
}: {
  pendingService: PendingService[];
  homeId: string;
}) {
  const router = useRouter();

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
      alert("Failed to approve service");
    }
  }

  if (pendingService.length === 0) {
    return (
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg text-white">No services awaiting approval.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          When contractors submit completed work, it will appear here for your review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingService.map((service) => {
        const images = service.attachments.filter((a) => a.mimeType?.startsWith("image/"));
        const docs = service.attachments.filter((a) => a.mimeType && !a.mimeType.startsWith("image/"));

        return (
          <div key={service.id} className={cardSurface}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-white sm:text-lg">{service.title}</h3>
                <p className="mt-1 text-sm text-white/70">
                  By:{" "}
                  {service.contractor.proProfile?.businessName ||
                    service.contractor.name ||
                    service.contractor.email}
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
                  {service.serviceDate ? <span>Work date: {formatDate(service.serviceDate)}</span> : null}
                  {service.cost !== null ? (
                    <span className="font-medium text-green-200">• Cost: ${Number(service.cost).toLocaleString()}</span>
                  ) : null}
                </div>
              </div>

              <div className="text-xs text-white/55">{formatDate(service.createdAt)}</div>
            </div>

            {service.description ? (
              <div className="mt-4">
                <div className={insetSurface}>
                  <p className="text-sm text-white/80 whitespace-pre-wrap">{service.description}</p>
                </div>
              </div>
            ) : null}

            {service.attachments.length > 0 ? (
              <div className="mt-5 space-y-4">
                {images.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                      Photos ({images.length})
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {images.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`/api/home/${homeId}/attachments/${attachment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                        >
                          <Image
                            src={`/api/home/${homeId}/attachments/${attachment.id}`}
                            alt={attachment.filename}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {docs.length > 0 ? (
                  <div>
                    <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/55">
                      Documents ({docs.length})
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {docs.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={`/api/home/${homeId}/attachments/${attachment.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                            <span className="text-lg">{attachment.mimeType?.includes("pdf") ? "📄" : "📎"}</span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-white">{attachment.filename}</div>
                            <div className="text-xs text-white/60">{(attachment.size / 1024).toFixed(1)} KB</div>
                          </div>

                          <span className={ctaGhost}>Open</span>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApprove(service.id)}
                className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/15 hover:border-emerald-300/35"
              >
                ✓ Approve &amp; add to records
              </button>

              <button
                type="button"
                onClick={() => handleReject(service.id)}
                className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}