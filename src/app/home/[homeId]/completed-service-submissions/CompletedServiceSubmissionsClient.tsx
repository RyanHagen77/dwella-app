"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { foggyApprove, foggyReject } from "@/components/ui/foggyButtons";

/* ============================================================================
   TYPE DEFINITIONS
   ============================================================================ */

type ProProfile = {
  businessName: string | null;
  company: string | null;
  phone: string | null;
  rating: number | null;
  verified: boolean;
};

type Contractor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  proProfile: ProProfile | null;
};

type Connection = {
  id: string;
  contractor: Contractor;
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
  contractor: Contractor;
  createdAt: string;
  attachments: PendingServiceAttachment[];
};

type Quote = {
  id: string;
  totalAmount: number;
  status: string;
  expiresAt: string | null;
};

type ServiceRecord = {
  id: string;
  status: string;
  serviceDate: string;
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
  contractor: Contractor;
  quote: Quote | null;
  serviceRecord: ServiceRecord | null;
};

type Tab = "all" | "requests" | "submissions";

type ServiceStatusFilter =
  | "ALL"
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";

/* ============================================================================
   STYLING CONSTANTS
   ============================================================================ */

const styles = {
  // Pills (tabs)
  pill: {
    base: "rounded-full border px-4 py-2 text-sm transition-colors",
    active: "border-white/25 bg-black/35 text-white",
    idle: "border-white/15 bg-black/20 text-white/80 hover:border-white/20 hover:bg-black/25",
  },

  // Filter pills
  filterPill: {
    base: "rounded-full border px-3 py-1 text-xs sm:text-sm transition-colors",
    active: "border-white/25 bg-black/35 text-white",
    idle: "border-white/15 bg-black/20 text-white/70 hover:border-white/20 hover:bg-black/25",
  },

  // Surfaces
  card: "rounded-2xl border border-white/12 bg-black/25 p-5 transition-colors hover:border-white/15 hover:bg-black/28",
  cardLink: "rounded-2xl border border-white/12 bg-black/25 p-5 block transition-colors hover:border-white/15 hover:bg-black/28",
  inset: "rounded-2xl border border-white/10 bg-black/20 p-4",

  // Mobile filter toggle
  filterToggle:
    "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/85 hover:bg-black/25 transition-colors",

  // Divider
  divider: "h-px bg-white/10",

  // Status badges
  badge: {
    base: "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium",
    pending: "bg-orange-500/15 text-orange-200 border-orange-500/20",
    quoted: "bg-blue-500/15 text-blue-200 border-blue-500/20",
    accepted: "bg-green-500/15 text-green-200 border-green-500/20",
    inProgress: "bg-purple-500/15 text-purple-200 border-purple-500/20",
    completed: "bg-emerald-500/15 text-emerald-200 border-emerald-500/20",
    declined: "bg-red-500/15 text-red-200 border-red-500/20",
    cancelled: "bg-gray-500/15 text-gray-200 border-gray-500/20",
  },

  // Urgency badges
  urgency: {
    base: "inline-flex items-center rounded-full px-2.5 py-1 text-xs",
    emergency: "bg-red-600/20 text-red-100 border border-red-600/25",
    high: "bg-orange-500/15 text-orange-100 border border-orange-500/20",
    normal: "bg-blue-500/15 text-blue-100 border border-blue-500/20",
    low: "bg-gray-500/15 text-gray-100 border border-gray-500/20",
  },
};

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

function getContractorDisplayName(contractor: Contractor): string {
  return (
    contractor.proProfile?.businessName ||
    contractor.name ||
    contractor.email
  );
}

/* ============================================================================
   ICON COMPONENTS
   ============================================================================ */

function FilterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white/70"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M7 12h10M10 18h4"
      />
    </svg>
  );
}

/* ============================================================================
   BADGE COMPONENTS
   ============================================================================ */

function StatusBadge({ status }: { status: string }) {
  const badgeStyles: Record<string, string> = {
    PENDING: styles.badge.pending,
    QUOTED: styles.badge.quoted,
    ACCEPTED: styles.badge.accepted,
    IN_PROGRESS: styles.badge.inProgress,
    COMPLETED: styles.badge.completed,
    DECLINED: styles.badge.declined,
    CANCELLED: styles.badge.cancelled,
  };

  return (
    <span className={`${styles.badge.base} ${badgeStyles[status] || styles.badge.pending}`}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: string }) {
  const urgencyStyles: Record<string, string> = {
    EMERGENCY: styles.urgency.emergency,
    HIGH: styles.urgency.high,
    NORMAL: styles.urgency.normal,
    LOW: styles.urgency.low,
  };

  return (
    <span className={`${styles.urgency.base} ${urgencyStyles[urgency] || styles.urgency.normal}`}>
      {urgency}
    </span>
  );
}

/* ============================================================================
   EMPTY STATE COMPONENTS
   ============================================================================ */

function EmptyState({
  icon,
  title,
  description,
  ctaText,
  ctaHref,
}: {
  icon: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
}) {
  return (
    <div className="py-10 text-center">
      <div className="mb-4 text-5xl">{icon}</div>
      <p className="text-lg text-white">{title}</p>
      <p className={`mt-2 text-sm ${textMeta}`}>{description}</p>
      {ctaText && ctaHref && (
        <Link href={ctaHref} className={`${ctaPrimary} mt-4 inline-block`}>
          {ctaText}
        </Link>
      )}
    </div>
  );
}

/* ============================================================================
   SERVICE REQUEST CARD COMPONENT
   ============================================================================ */

function ServiceRequestCard({
  service,
  homeId,
}: {
  service: ServiceRequest;
  homeId: string;
}) {
  return (
    <Link
      href={`/home/${homeId}/service-requests/${service.id}`}
      className={styles.cardLink}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          {/* Title and badges */}
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-white sm:text-lg">
              {service.title}
            </h3>
            <StatusBadge status={service.status} />
            <UrgencyBadge urgency={service.urgency} />
          </div>

          {/* Description */}
          <p className="text-sm text-white/70 line-clamp-2">
            {service.description}
          </p>

          {/* Contractor and metadata */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
            {service.contractor.image ? (
              <Image
                src={service.contractor.image}
                alt={getContractorDisplayName(service.contractor)}
                width={24}
                height={24}
                className="h-6 w-6 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <div className="h-6 w-6 rounded-full border border-white/10 bg-black/20" />
            )}

            <span className="truncate">
              {getContractorDisplayName(service.contractor)}
            </span>

            {service.category && <span>• {service.category}</span>}
            {service.desiredDate && (
              <span>• Desired: {formatDate(service.desiredDate)}</span>
            )}
          </div>

          {/* Budget */}
          {(service.budgetMin || service.budgetMax) && (
            <div className="mt-2 text-sm text-white/60">
              Budget: ${service.budgetMin?.toLocaleString() || "0"} – $
              {service.budgetMax?.toLocaleString() || "0"}
            </div>
          )}

          {/* Quote */}
          {service.quote && (
            <div className={`mt-4 ${styles.inset}`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-white/70">
                    Quote received
                  </div>
                  <div className="mt-1 text-lg font-semibold text-white">
                    ${Number(service.quote.totalAmount).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-white/60">
                  {service.quote.status}
                </div>
              </div>
            </div>
          )}

          {/* Service record */}
          {service.serviceRecord && (
            <div className={`mt-4 ${styles.inset}`}>
              <div className="text-xs font-medium text-white/70">
                Work scheduled
              </div>
              <div className="mt-1 text-sm text-white/80">
                {formatDate(service.serviceRecord.serviceDate)} •{" "}
                {service.serviceRecord.status}
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="shrink-0 text-xs text-white/55 sm:text-right">
          <div>Created: {formatDate(service.createdAt)}</div>
          {service.status !== "PENDING" && (
            <div className="mt-1">Updated: {formatDate(service.updatedAt)}</div>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ============================================================================
   PENDING SERVICE CARD COMPONENT
   ============================================================================ */

function PendingServiceCard({
  service,
  homeId,
  onApprove,
  onReject,
}: {
  service: PendingService;
  homeId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const images = service.attachments.filter((a) =>
    a.mimeType?.startsWith("image/")
  );
  const docs = service.attachments.filter(
    (a) => a.mimeType && !a.mimeType.startsWith("image/")
  );

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-white sm:text-lg">
            {service.title}
          </h3>

          <p className="mt-1 text-sm text-white/70">
            By: {getContractorDisplayName(service.contractor)}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
            {service.serviceDate && (
              <span>Work date: {formatDate(service.serviceDate)}</span>
            )}
            {service.cost !== null && (
              <span className="font-medium text-green-200">
                • Cost: ${Number(service.cost).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="text-xs text-white/55">
          {formatDate(service.createdAt)}
        </div>
      </div>

      {/* Description */}
      {service.description && (
        <div className="mt-4">
          <div className={styles.inset}>
            <p className="whitespace-pre-wrap text-sm text-white/80">
              {service.description}
            </p>
          </div>
        </div>
      )}

      {/* Attachments */}
      {service.attachments.length > 0 && (
        <div className="mt-5 space-y-4">
          {/* Images */}
          {images.length > 0 && (
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
                    className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition-opacity hover:opacity-90"
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
          )}

          {/* Documents */}
          {docs.length > 0 && (
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
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:bg-black/25"
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                      <span className="text-lg">
                        {attachment.mimeType?.includes("pdf") ? "📄" : "📎"}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-white">
                        {attachment.filename}
                      </div>
                      <div className="text-xs text-white/60">
                        {(attachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>

                    <span className={ctaGhost}>Open</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onApprove(service.id)}
          className={foggyApprove}
        >
          ✓ Approve &amp; add to records
        </button>

        <button
          type="button"
          onClick={() => onReject(service.id)}
          className={foggyReject}
        >
          ✗ Reject
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   TAB COMPONENTS
   ============================================================================ */

function AllTab({
  serviceRequests,
  pendingService,
  homeId,
}: {
  serviceRequests: ServiceRequest[];
  pendingService: PendingService[];
  homeId: string;
}) {
  const hasAny = serviceRequests.length > 0 || pendingService.length > 0;

  if (!hasAny) {
    return (
      <EmptyState
        icon="🔨"
        title="No requests or pending work yet."
        description="Request work from your connected pros to get started."
        ctaText="+ Request Service"
        ctaHref={`/home/${homeId}/service-requests/new`}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Service Requests */}
      {serviceRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white/85">
            Service Requests{" "}
            <span className="text-white/45">({serviceRequests.length})</span>
          </h2>
          <ServiceRequestsTab
            serviceRequests={serviceRequests}
            homeId={homeId}
          />
        </div>
      )}

      {/* Divider */}
      {serviceRequests.length > 0 && pendingService.length > 0 && (
        <div className={styles.divider} />
      )}

      {/* Pending Submissions */}
      {pendingService.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-white/85">
            Pending Submissions{" "}
            <span className="text-white/45">({pendingService.length})</span>
          </h2>
          <PendingServiceTab
            pendingService={pendingService}
            homeId={homeId}
          />
        </div>
      )}
    </div>
  );
}

function ServiceRequestsTab({
  serviceRequests,
  homeId,
}: {
  serviceRequests: ServiceRequest[];
  homeId: string;
}) {
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  if (serviceRequests.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No service requests yet."
        description="Request work from your connected pros to get started."
        ctaText="+ Request Service"
        ctaHref={`/home/${homeId}/service-requests/new`}
      />
    );
  }

  const filtered =
    statusFilter === "ALL"
      ? serviceRequests
      : serviceRequests.filter((r) => r.status === statusFilter);

  const currentLabel =
    statusOptions.find((o) => o.value === statusFilter)?.label ?? "All";

  return (
    <div className="space-y-4">
      {/* Heading + filter toggle (mobile) */}
      <div className="flex items-center justify-between gap-3">
        <div />

        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className={`sm:hidden ${styles.filterToggle}`}
          aria-expanded={filtersOpen}
        >
          <FilterIcon />
          Filters <span className="text-white/55">({currentLabel})</span>
          <span className="ml-1 text-white/50">{filtersOpen ? "▴" : "▾"}</span>
        </button>
      </div>

      {/* Filters — pills. Hidden on mobile unless toggled. */}
      <div className={`${filtersOpen ? "flex" : "hidden"} flex-wrap gap-2 sm:flex`}>
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => {
              setStatusFilter(opt.value as ServiceStatusFilter);
              setFiltersOpen(false);
            }}
            className={`${styles.filterPill.base} ${
              statusFilter === opt.value ? styles.filterPill.active : styles.filterPill.idle
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Service request cards */}
      <div className="space-y-4">
        {filtered.map((service) => (
          <ServiceRequestCard
            key={service.id}
            service={service}
            homeId={homeId}
          />
        ))}
      </div>
    </div>
  );
}

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
      const res = await fetch(
        `/api/home/${homeId}/completed-service-submissions/${serviceId}/approve`,
        { method: "POST" }
      );
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
      const res = await fetch(
        `/api/home/${homeId}/completed-service-submissions/${serviceId}/reject`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Failed to reject service");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting service:", error);
      alert("Failed to reject service");
    }
  }

  if (pendingService.length === 0) {
    return (
      <EmptyState
        icon="✅"
        title="No services awaiting approval."
        description="When contractors submit completed work, it will appear here for your review."
      />
    );
  }

  return (
    <div className="space-y-4">
      {pendingService.map((service) => (
        <PendingServiceCard
          key={service.id}
          service={service}
          homeId={homeId}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ))}
    </div>
  );
}

/* ============================================================================
   MAIN COMPONENT
   ============================================================================ */

export default function CompletedServiceSubmissionsClient({
  homeId,
  requestHref,
  pendingService,
  serviceRequests,
}: {
  homeId: string;
  requestHref: string;
  connections: Connection[];
  pendingService: PendingService[];
  serviceRequests: ServiceRequest[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const totalRequests = serviceRequests.length;
  const totalPendingApprovals = pendingService.length;
  const totalAll = totalRequests + totalPendingApprovals;

  return (
    <div className="space-y-6">
      {/* Tabs and CTA */}
      <div className="space-y-3">
        {/* Tab pills */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`${styles.pill.base} ${
              activeTab === "all" ? styles.pill.active : styles.pill.idle
            }`}
          >
            All{totalAll ? ` (${totalAll})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("requests")}
            className={`${styles.pill.base} ${
              activeTab === "requests" ? styles.pill.active : styles.pill.idle
            }`}
          >
            Service Requests{totalRequests ? ` (${totalRequests})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`${styles.pill.base} ${
              activeTab === "submissions" ? styles.pill.active : styles.pill.idle
            }`}
          >
            Pending Submissions
            {totalPendingApprovals ? ` (${totalPendingApprovals})` : ""}
          </button>
        </div>

        {/* CTA button - below tabs */}
        <div>
          <Link href={requestHref} className={ctaPrimary}>
            + Request Service
          </Link>
        </div>
      </div>

      {/* Tab content */}
      <div className="space-y-6">
        {activeTab === "all" && (
          <AllTab
            serviceRequests={serviceRequests}
            pendingService={pendingService}
            homeId={homeId}
          />
        )}

        {activeTab === "requests" && (
          <ServiceRequestsTab
            serviceRequests={serviceRequests}
            homeId={homeId}
          />
        )}

        {activeTab === "submissions" && (
          <PendingServiceTab pendingService={pendingService} homeId={homeId} />
        )}
      </div>
    </div>
  );
}