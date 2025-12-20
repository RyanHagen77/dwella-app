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

/* =========================
   Styling primitives
   - NO hover
   - NO transitions
   - darker surfaces (no washed white)
   ========================= */

const pillBase = "rounded-full border px-4 py-2 text-sm";
const pillActive = "border-white/25 bg-black/35 text-white";
const pillIdle = "border-white/15 bg-black/20 text-white/80";

const filterPillBase = "rounded-full border px-3 py-1 text-xs sm:text-sm";
const filterActive = "border-white/25 bg-black/35 text-white";
const filterIdle = "border-white/15 bg-black/20 text-white/70";

const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

/* link card: looks like a card, no hover effects */
const cardLink = `${cardSurface} block`;

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString();
}

export default function CompletedServiceSubmissionsClient({
  homeId,
  pendingService,
  serviceRequests,
}: {
  homeId: string;
  homeAddress: string; // unused intentionally (layout is server-owned)
  connections: Connection[]; // unused intentionally
  pendingService: PendingService[];
  serviceRequests: ServiceRequest[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const totalRequests = serviceRequests.length;
  const totalPendingApprovals = pendingService.length;
  const totalAll = totalRequests + totalPendingApprovals;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={[pillBase, activeTab === "all" ? pillActive : pillIdle].join(" ")}
        >
          All{totalAll > 0 ? ` (${totalAll})` : ""}
        </button>

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
      <div className="space-y-6">
        {activeTab === "all" && (
          <AllTab serviceRequests={serviceRequests} pendingService={pendingService} homeId={homeId} />
        )}

        {activeTab === "requests" && <ServiceRequestsTab serviceRequests={serviceRequests} homeId={homeId} />}

        {activeTab === "submissions" && <PendingServiceTab pendingService={pendingService} homeId={homeId} />}
      </div>
    </div>
  );
}

/* ---------- All Tab ---------- */

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
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">🔨</div>
        <p className="text-lg text-white">No requests or pending work yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>Request work from your connected pros to get started.</p>
        <Link href={`/home/${homeId}/service-requests/new`} className={`${ctaPrimary} mt-4 inline-block`}>
          + Request Service
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {serviceRequests.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white/85">
            Service Requests <span className="text-white/45">({serviceRequests.length})</span>
          </h2>
          <ServiceRequestsTab serviceRequests={serviceRequests} homeId={homeId} />
        </div>
      )}

      {serviceRequests.length > 0 && pendingService.length > 0 && <div className="h-px bg-white/10" />}

      {pendingService.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-white/85">
            Pending Submissions <span className="text-white/45">({pendingService.length})</span>
          </h2>
          <PendingServiceTab pendingService={pendingService} homeId={homeId} />
        </div>
      )}
    </div>
  );
}

/* ---------- Service Requests Tab ---------- */

function ServiceRequestsTab({
  serviceRequests,
  homeId,
}: {
  serviceRequests: ServiceRequest[];
  homeId: string;
}) {
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>("ALL");

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
      <div className="py-10 text-center">
        <div className="mb-4 text-5xl">📋</div>
        <p className="text-lg text-white">No service requests yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>Request work from your connected pros to get started.</p>
        <Link href={`/home/${homeId}/service-requests/new`} className={`${ctaPrimary} mt-4 inline-block`}>
          + Request Service
        </Link>
      </div>
    );
  }

  const filtered =
    statusFilter === "ALL" ? serviceRequests : serviceRequests.filter((req) => req.status === statusFilter);

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
      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${styles[status] ?? styles.PENDING}`}>
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
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs ${styles[urgency] ?? styles.NORMAL}`}>
        {urgency}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value as ServiceStatusFilter)}
            className={[filterPillBase, statusFilter === opt.value ? filterActive : filterIdle].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>

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

                {(service.budgetMin || service.budgetMax) ? (
                  <div className="mt-2 text-sm text-white/60">
                    Budget: ${service.budgetMin?.toLocaleString() || "0"} – ${service.budgetMax?.toLocaleString() || "0"}
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
                {service.status !== "PENDING" ? <div className="mt-1">Updated: {formatDate(service.updatedAt)}</div> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- Pending Submissions Tab ---------- */

function PendingServiceTab({
  pendingService,
  homeId,
}: {
  pendingService: PendingService[]; // ✅ fix your typo: PendingService[], not pendingService[]
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
        <p className={`mt-2 text-sm ${textMeta}`}>When contractors submit completed work, it will appear here for your review.</p>
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
                  By: {service.contractor.proProfile?.businessName || service.contractor.name || service.contractor.email}
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
                className="rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-black"
              >
                ✓ Approve &amp; Add to Records
              </button>

              <button
                type="button"
                onClick={() => handleReject(service.id)}
                className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/90"
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