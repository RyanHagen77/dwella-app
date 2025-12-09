"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";

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
  updatedAt: string; // used for status-change display
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

export default function CompletedServiceSubmissionsClient({
  homeId,
  homeAddress,
  pendingService,
  serviceRequests,
}: {
  homeId: string;
  homeAddress: string;
  connections: Connection[];
  pendingService: PendingService[];
  serviceRequests: ServiceRequest[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const totalRequests = serviceRequests.length;
  const totalPendingApprovals = pendingService.length;

  return (
    <main className="relative min-h-screen text-white">
      {/* Background with gradient overlay */}
      <div className="fixed inset-0 -z-50">
        <Image
          src="/myhomedox_home3.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          href={`/home/${homeId}`}
          label={homeAddress}
          current="Service Requests"
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={`/home/${homeId}`}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to home"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Work Requests &amp; Pending Submissions
                </h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {totalRequests} active{" "}
                  {totalRequests === 1 ? "request" : "requests"} •{" "}
                  {totalPendingApprovals} awaiting approval
                </p>
              </div>
            </div>

            {/* Request Work Button */}
            <div className="flex-shrink-0">
              <Link
                href={`/home/${homeId}/service-requests/new`}
                className={ctaPrimary}
              >
                + Request Service
              </Link>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className={glass}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "all"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              All
              {totalRequests + totalPendingApprovals > 0 &&
                ` (${totalRequests + totalPendingApprovals})`}
            </button>

            <button
              onClick={() => setActiveTab("requests")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "requests"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Service Requests
              {totalRequests > 0 && ` (${totalRequests})`}
            </button>

            <button
              onClick={() => setActiveTab("submissions")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "submissions"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Pending Submissions
              {totalPendingApprovals > 0 && ` (${totalPendingApprovals})`}
            </button>
          </div>
        </section>

        {/* Content */}
        <section className={glass}>
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
        </section>
      </div>
    </main>
  );
}

/* ---------- All Tab (Combined View) ---------- */

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
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">🔨</div>
        <p className="text-lg">No requests or pending work yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          Request work from your connected pros to get started.
        </p>
        <Link
          href={`/home/${homeId}/service-requests/new`}
          className={`${ctaPrimary} inline-block mt-4`}
        >
          + Request Service
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {serviceRequests.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Service Requests ({serviceRequests.length})
          </h2>
          <ServiceRequestsTab
            serviceRequests={serviceRequests}
            homeId={homeId}
          />
        </div>
      )}

      {serviceRequests.length > 0 && pendingService.length > 0 && (
        <div className="h-px bg-white/10" />
      )}

      {pendingService.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            Pending Submissions ({pendingService.length})
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
  const [statusFilter, setStatusFilter] =
    useState<ServiceStatusFilter>("ALL");

  if (serviceRequests.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">📋</div>
        <p className="text-lg">No service requests yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          Request work from your connected pros to get started.
        </p>
        <Link
          href={`/home/${homeId}/service-requests/new`}
          className={`${ctaPrimary} inline-block mt-4`}
        >
          + Request Service
        </Link>
      </div>
    );
  }

  const filteredRequests =
    statusFilter === "ALL"
      ? serviceRequests
      : serviceRequests.filter((req) => req.status === statusFilter);

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-orange-500/20 text-orange-300 border-orange-500/30",
      QUOTED: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/30",
      IN_PROGRESS: "bg-purple-500/20 text-purple-300 border-purple-500/30",
      COMPLETED: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
      DECLINED: "bg-red-500/20 text-red-300 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    };

    return (
      <span
        className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.PENDING
        }`}
      >
        {status.replace("_", " ")}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const styles = {
      EMERGENCY: "bg-red-600/25 text-red-200",
      HIGH: "bg-orange-500/20 text-orange-300",
      NORMAL: "bg-blue-500/20 text-blue-300",
      LOW: "bg-gray-500/20 text-gray-300",
    };

    return (
      <span
        className={`inline-block rounded px-2 py-0.5 text-xs ${
          styles[urgency as keyof typeof styles] || styles.NORMAL
        }`}
      >
        {urgency}
      </span>
    );
  };

  const getStatusDateLabel = (status: string) => {
    switch (status) {
      case "CANCELLED":
        return "Cancelled on";
      case "DECLINED":
        return "Declined on";
      case "COMPLETED":
        return "Completed on";
      case "IN_PROGRESS":
        return "Updated on";
      case "ACCEPTED":
      case "QUOTED":
        return "Updated on";
      default:
        return "Created on";
    }
  };

  return (
    <>
      {/* Status filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        {[
          { label: "All", value: "ALL" },
          { label: "Pending", value: "PENDING" },
          { label: "Quoted", value: "QUOTED" },
          { label: "Accepted", value: "ACCEPTED" },
          { label: "In Progress", value: "IN_PROGRESS" },
          { label: "Completed", value: "COMPLETED" },
          { label: "Declined", value: "DECLINED" },
          { label: "Cancelled", value: "CANCELLED" },
        ].map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setStatusFilter(opt.value as ServiceStatusFilter)}
            className={`rounded-full border px-3 py-1 transition ${
              statusFilter === opt.value
                ? "border-white/60 bg-white/20 text-white"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredRequests.map((service) => (
          <Link
            key={service.id}
            href={`/home/${homeId}/service-requests/${service.id}`}
            className="block rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-white">
                    {service.title}
                  </h3>
                  {getStatusBadge(service.status)}
                  {getUrgencyBadge(service.urgency)}
                </div>

                <p className="text-sm text-white/70 line-clamp-2">
                  {service.description}
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                  {service.contractor.image && (
                    <Image
                      src={service.contractor.image}
                      alt={service.contractor.name || service.contractor.email}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                  )}
                  <span>
                    {service.contractor.proProfile?.businessName ||
                      service.contractor.name ||
                      service.contractor.email}
                  </span>
                  {service.category && <span>• {service.category}</span>}
                  {service.desiredDate && (
                    <span>
                      • Desired:{" "}
                      {new Date(service.desiredDate).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {(service.budgetMin || service.budgetMax) && (
                  <div className="mt-2 text-sm text-white/60">
                    Budget: ${service.budgetMin?.toLocaleString() || "0"} - $
                    {service.budgetMax?.toLocaleString() || "0"}
                  </div>
                )}

                {service.quote && (
                  <div className="mt-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-300">
                          Quote Received
                        </p>
                        <p className="text-lg font-bold text-white">
                          ${Number(service.quote.totalAmount).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs text-blue-300/80">
                        {service.quote.status}
                      </span>
                    </div>
                  </div>
                )}

                {service.serviceRecord && (
                  <div className="mt-3 rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                    <p className="text-sm font-medium text-green-300">
                      Work Scheduled
                    </p>
                    <p className="text-sm text-white/80">
                      {new Date(
                        service.serviceRecord.serviceDate
                      ).toLocaleDateString()}{" "}
                      • {service.serviceRecord.status}
                    </p>
                  </div>
                )}
              </div>

              <div className="text-right text-xs text-white/50 space-y-1">
                <div>
                  Created:{" "}
                  {new Date(service.createdAt).toLocaleDateString()}
                </div>
                {service.status !== "PENDING" && (
                  <div>
                    {getStatusDateLabel(service.status)}{" "}
                    {new Date(service.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

/* ---------- Pending Approvals Tab ---------- */

function PendingServiceTab({
  pendingService,
  homeId,
}: {
  pendingService: pendingService[];
  homeId: string;
}) {
  const router = useRouter();

  async function handleApprove(serviceId: string) {
    try {
      const res = await fetch(
        `/api/home/${homeId}/completed-service-submissions/${serviceId}/approve`,
        {
          method: "POST",
        }
      );

      if (!res.ok) throw new Error("Failed to approve service");

      alert("Service approved and added to your records!");
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
        {
          method: "POST",
        }
      );

      if (!res.ok) throw new Error("Failed to reject service");

      alert("Service rejected.");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting service:", error);
      alert("Failed to reject service");
    }
  }

  if (pendingService.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg">No services awaiting approval.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          When contractors submit completed work, it will appear here for your
          review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingService.map((service) => {
        const hasImages = service.attachments.some((a) =>
          a.mimeType?.startsWith("image/")
        );
        const hasDocs = service.attachments.some(
          (a) => a.mimeType && !a.mimeType.startsWith("image/")
        );

        return (
          <div
            key={service.id}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {service.title}
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  By:{" "}
                  {service.contractor.proProfile?.businessName ||
                    service.contractor.name ||
                    service.contractor.email}
                </p>
                {service.serviceDate && (
                  <p className="mt-1 text-sm text-white/60">
                    Work Date:{" "}
                    {new Date(service.serviceDate).toLocaleDateString()}
                  </p>
                )}
                {service.cost !== null && (
                  <p className="mt-1 text-sm font-medium text-green-300">
                    Cost: ${Number(service.cost).toLocaleString()}
                  </p>
                )}
              </div>
              <div className="text-xs text-white/50">
                {new Date(service.createdAt).toLocaleDateString()}
              </div>
            </div>

            {service.description && (
              <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/80 whitespace-pre-wrap">
                  {service.description}
                </p>
              </div>
            )}

            {/* Attachments preview */}
            {service.attachments.length > 0 && (
              <div className="mb-4 space-y-4">
                {hasImages && (
                  <div>
                    <h4 className={`mb-2 text-sm font-medium ${textMeta}`}>
                      Photos (
                      {
                        service.attachments.filter((a) =>
                          a.mimeType?.startsWith("image/")
                        ).length
                      }
                      )
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {service.attachments
                        .filter((a) => a.mimeType?.startsWith("image/"))
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:opacity-90"
                          >
                            <Image
                              src={`/api/home/${homeId}/attachments/${attachment.id}`}
                              alt={attachment.filename}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                              <span className="text-xs text-white opacity-0 group-hover:opacity-100">
                                View
                              </span>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {hasDocs && (
                  <div>
                    <h4 className={`mb-2 text-sm font-medium ${textMeta}`}>
                      Documents (
                      {
                        service.attachments.filter(
                          (a) =>
                            a.mimeType && !a.mimeType.startsWith("image/")
                        ).length
                      }
                      )
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {service.attachments
                        .filter(
                          (a) =>
                            a.mimeType && !a.mimeType.startsWith("image/")
                        )
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white/10">
                              {attachment.mimeType?.includes("pdf") ? (
                                <span className="text-xl">📄</span>
                              ) : (
                                <span className="text-xl">📎</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-white">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-white/60">
                                {(attachment.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleApprove(service.id)}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-green-600 hover:to-emerald-600"
              >
                ✓ Approve &amp; Add to Records
              </button>
              <button
                onClick={() => handleReject(service.id)}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
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