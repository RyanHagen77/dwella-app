/**
 * SERVICE REQUESTS LIST PAGE (CONTRACTOR)
 *
 * View all service requests assigned to this contractor
 *
 * Location: app/contractor/service-requests/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { glass, glassTight, heading, textMeta } from "@/lib/glass";
import { format } from "date-fns";
import type { Prisma } from "@prisma/client";

// Type for each job request in this list
type ContractorServiceRequest = Prisma.ServiceRequestGetPayload<{
  include: {
    home: {
      select: {
        address: true;
        city: true;
        state: true;
      };
    };
    homeowner: {
      select: {
        name: true;
        image: true;
      };
    };
    quote: {
      select: {
        id: true;
        totalAmount: true;
      };
    };
  };
}>;

type StatusConfig = Record<
  string,
  { label: string; color: string; bg: string }
>;

export default async function ContractorServiceRequestsPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/");
  }

  // Fetch all service requests for this contractor
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: {
      contractorId: session.user.id,
    },
    include: {
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
      homeowner: {
        select: {
          name: true,
          image: true,
        },
      },
      quote: {
        select: {
          id: true,
          totalAmount: true,
        },
      },
    },
    orderBy: [
      { status: "asc" }, // PENDING first
      { createdAt: "desc" },
    ],
  });

  // Group by status
  const pending = serviceRequests.filter((jr) => jr.status === "PENDING");
  const quoted = serviceRequests.filter((jr) => jr.status === "QUOTED");
  const accepted = serviceRequests.filter((jr) => jr.status === "ACCEPTED");
  const inProgress = serviceRequests.filter((jr) => jr.status === "IN_PROGRESS");
  const completed = serviceRequests.filter((jr) => jr.status === "COMPLETED");
  const declined = serviceRequests.filter((jr) => jr.status === "DECLINED");
  const cancelled = serviceRequests.filter((jr) => jr.status === "CANCELLED");

  const statusConfig: StatusConfig = {
    PENDING: {
      label: "Pending",
      color: "text-orange-300",
      bg: "bg-orange-500/10 border-orange-500/30",
    },
    QUOTED: {
      label: "Quoted",
      color: "text-blue-300",
      bg: "bg-blue-500/10 border-blue-500/30",
    },
    ACCEPTED: {
      label: "Accepted",
      color: "text-green-300",
      bg: "bg-green-500/10 border-green-500/30",
    },
    IN_PROGRESS: {
      label: "In Progress",
      color: "text-purple-300",
      bg: "bg-purple-500/10 border-purple-500/30",
    },
    COMPLETED: {
      label: "Completed",
      color: "text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    DECLINED: {
      label: "Declined",
      color: "text-gray-300",
      bg: "bg-gray-500/10 border-gray-500/30",
    },
    CANCELLED: {
      label: "Cancelled",
      color: "text-gray-300",
      bg: "bg-gray-500/10 border-gray-500/30",
    },
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Service Requests</span>
        </nav>

        {/* Header w/ back arrow */}
        <section className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/pro/contractor/dashboard"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to dashboard"
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
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>

              <div className="min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Service Requests
                </h1>
                <p className={`mt-1 text-xs ${textMeta}`}>
                  {serviceRequests.length} total request
                  {serviceRequests.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>

            {pending.length > 0 && (
              <div className="text-right">
                <div className="text-2xl font-bold text-orange-300">
                  {pending.length}
                </div>
                <div className={`text-sm ${textMeta}`}>Pending</div>
              </div>
            )}
          </div>
        </section>

        {/* Empty State */}
        {serviceRequests.length === 0 && (
          <section className={glass}>
            <div className="py-12 text-center">
              <p className={`text-lg ${textMeta}`}>No service requests yet.</p>
              <p className={`mt-2 text-sm ${textMeta}`}>
                Service requests from homeowners will appear here.
              </p>
            </div>
          </section>
        )}

        {/* Active Requests (Pending, Quoted, Accepted, In Progress) */}
        {(pending.length > 0 ||
          quoted.length > 0 ||
          accepted.length > 0 ||
          inProgress.length > 0) && (
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
              Active Requests
            </h2>
            <div className="space-y-3">
              {[...pending, ...quoted, ...accepted, ...inProgress].map(
                (serviceRequest) => (
                  <ServiceRequestCard
                    key={serviceRequest.id}
                    serviceRequest={serviceRequest}
                    statusConfig={statusConfig}
                  />
                )
              )}
            </div>
          </section>
        )}

        {/* Completed */}
        {completed.length > 0 && (
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
              Completed ({completed.length})
            </h2>
            <div className="space-y-3">
              {completed.map((serviceRequest) => (
                <ServiceRequestCard
                  key={serviceRequest.id}
                  serviceRequest={serviceRequest}
                  statusConfig={statusConfig}
                />
              ))}
            </div>
          </section>
        )}

        {/* Declined/Cancelled */}
        {(declined.length > 0 || cancelled.length > 0) && (
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
              Declined &amp; Cancelled (
              {declined.length + cancelled.length})
            </h2>
            <div className="space-y-3">
              {[...declined, ...cancelled].map((serviceRequest) => (
                <ServiceRequestCard
                  key={serviceRequest.id}
                  serviceRequest={serviceRequest}
                  statusConfig={statusConfig}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ServiceRequestCard({
  serviceRequest,
  statusConfig,
}: {
  serviceRequest: ContractorServiceRequest;
  statusConfig: StatusConfig;
}) {
  const status = statusConfig[serviceRequest.status] || statusConfig.PENDING;
  const isUnread = serviceRequest.status === "PENDING" && !serviceRequest.respondedAt;

  const homeownerName = serviceRequest.homeowner?.name || "Homeowner";
  const addressLine = [
    serviceRequest.home.address,
    serviceRequest.home.city,
    serviceRequest.home.state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Link
      href={`/pro/contractor/service-requests/${serviceRequest.id}`}
      className={`${glassTight} flex items-start gap-4 hover:bg-white/10 transition-colors ${
        isUnread ? "ring-2 ring-orange-500/50" : ""
      }`}
    >
      {/* Homeowner Avatar */}
      {serviceRequest.homeowner?.image ? (
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
          <Image
            src={serviceRequest.homeowner.image}
            alt={homeownerName}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="h-12 w-12 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center">
          <span className="text-xl font-medium">
            {homeownerName[0]?.toUpperCase() || "H"}
          </span>
        </div>
      )}

      <div className="min-w-0 flex-1">
        {/* Title & Status */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <h3 className="flex-1 truncate font-semibold text-white">
            {serviceRequest.title}
            {isUnread && (
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-orange-500" />
            )}
          </h3>
          <span
            className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${status.bg} ${status.color}`}
          >
            {status.label}
          </span>
        </div>

        {/* Homeowner & Location */}
        <p className={`mb-2 text-sm ${textMeta}`}>
          {homeownerName}
          {addressLine && ` • ${addressLine}`}
        </p>

        {/* Details */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/60">
          <span>{serviceRequest.category || "General"}</span>
          <span>•</span>
          <span>{serviceRequest.urgency}</span>
          {serviceRequest.budgetMin && serviceRequest.budgetMax && (
            <>
              <span>•</span>
              <span>
                ${Number(serviceRequest.budgetMin).toLocaleString()} - $
                {Number(serviceRequest.budgetMax).toLocaleString()}
              </span>
            </>
          )}
          {serviceRequest.quote && (
            <>
              <span>•</span>
              <span className="font-medium text-green-300">
                Quote: $
                {Number(serviceRequest.quote.totalAmount).toLocaleString()}
              </span>
            </>
          )}
        </div>

        {/* Date */}
        <p className={`mt-2 text-xs ${textMeta}`}>
          Requested {format(serviceRequest.createdAt, "MMM d, yyyy")}
        </p>
      </div>
    </Link>
  );
}

function Bg() {
  return (
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
  );
}