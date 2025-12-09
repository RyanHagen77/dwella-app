/**
 * PROPERTY DETAIL PAGE (CONTRACTOR)
 *
 * Relationship-centered view with:
 * - Growth opportunities (warranties, reminders)
 * - Relationship health indicators
 * - Context-aware quick actions
 * - Enhanced stats and metrics
 * - Read-only mode for archived/disconnected homeowners
 *
 * Location: app/(pro)/pro/contractor/properties/[propertyId]/page.tsx
 */

export const dynamic = "force-dynamic";

import React from "react";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";
import { serializeConnections } from "@/lib/serialize";
import Image from "next/image";
import Link from "next/link";
import {
  glass,
  glassTight,
  heading,
  textMeta,
  ctaPrimary,
} from "@/lib/glass";
import { format, formatDistanceToNow } from "date-fns";
import Breadcrumb from "@/components/ui/Breadcrumb";

type PageProps = {
  params: Promise<{ propertyId: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { propertyId: id } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch property with all related data including opportunities
  // Include ARCHIVED status so we can show read-only view
  const property = await prisma.home.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      connections: {
        where: {
          contractorId: session.user.id,
          status: { in: ["ACTIVE", "ARCHIVED"] },
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          verifiedServiceCount: true,
          totalSpent: true,
          lastServiceDate: true,
          archivedAt: true,
        },
      },
      serviceRecords: {
        where: {
          contractorId: session.user.id,
        },
        orderBy: {
          serviceDate: "desc",
        },
        select: {
          id: true,
          serviceType: true,
          serviceDate: true,
          cost: true,
          status: true,
          description: true,
          photos: true,
          createdAt: true,
        },
      },
      serviceRequests: {
        where: {
          contractorId: session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          urgency: true,
          status: true,
          budgetMin: true,
          budgetMax: true,
          desiredDate: true,
          createdAt: true,
          respondedAt: true,
          quote: {
            select: {
              totalAmount: true,
            },
          },
        },
      },
      // Fetch opportunities
      warranties: {
        where: {
          expiresAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          expiresAt: "asc",
        },
        select: {
          id: true,
          item: true,
          expiresAt: true,
          provider: true,
        },
      },
      reminders: {
        where: {
          dueAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        },
        orderBy: {
          dueAt: "asc",
        },
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
      },
    },
  });

  if (!property) {
    notFound();
  }

  // Verify contractor has access to this property
  const rawConnection = property.connections[0];
  if (!rawConnection) {
    redirect("/pro/contractor/properties");
  }

  // Serialize connection to convert Decimal to number
  const [connection] = serializeConnections([rawConnection]);

  const isArchived = connection.status === "ARCHIVED";

  const addrLine = [
    property.address,
    property.city,
    property.state,
    property.zip,
  ]
    .filter(Boolean)
    .join(", ");

  // Calculate relationship metrics
  const now = Date.now();
  const daysSinceConnection = Math.floor(
    (now - new Date(connection.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysSinceLastService = connection.lastServiceDate
    ? Math.floor(
        (now - new Date(connection.lastServiceDate).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const relationshipHealth: "excellent" | "good" | "needs-attention" =
    isArchived
      ? "needs-attention"
      : !daysSinceLastService || daysSinceLastService > 180
      ? "needs-attention"
      : daysSinceLastService < 90
      ? "excellent"
      : "good";

  // Process opportunities with days until (only for active)
  const expiringWarranties = isArchived
    ? []
    : property.warranties.map((w) => ({
        ...w,
        daysUntil: Math.ceil(
          (new Date(w.expiresAt!).getTime() - now) / (1000 * 60 * 60 * 24)
        ),
      }));

  const upcomingReminders = isArchived
    ? []
    : property.reminders.map((r) => ({
        ...r,
        daysUntil: Math.ceil(
          (new Date(r.dueAt).getTime() - now) / (1000 * 60 * 60 * 24)
        ),
      }));

  const totalOpportunities = expiringWarranties.length + upcomingReminders.length;

  // Calculate stats
  const totalRevenue = connection.totalSpent || 0;
  const pendingRequests = isArchived
    ? []
    : property.serviceRequests.filter(
        (req) => req.status === "PENDING" || req.status === "QUOTED"
      );
  const firstPendingRequest = pendingRequests[0];

  const statusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    ACTIVE: {
      label: "Active Client",
      color: "text-emerald-300",
      bg: "bg-emerald-500/10 border-emerald-500/30",
    },
    ARCHIVED: {
      label: "Disconnected",
      color: "text-gray-300",
      bg: "bg-gray-500/10 border-gray-500/30",
    },
    PENDING: {
      label: "Connection Pending",
      color: "text-orange-300",
      bg: "bg-orange-500/10 border-orange-500/30",
    },
    INACTIVE: {
      label: "Inactive",
      color: "text-gray-300",
      bg: "bg-gray-500/10 border-gray-500/30",
    },
  };

  const connectionStatus =
    statusConfig[connection.status] || statusConfig.ACTIVE;

  const healthConfig = {
    excellent: {
      label: "Excellent",
      subtext: "Engaged client",
      dot: "bg-emerald-400",
    },
    good: {
      label: "Good",
      subtext: "Active relationship",
      dot: "bg-blue-400",
    },
    "needs-attention": {
      label: isArchived ? "Archived" : "At Risk",
      subtext: isArchived
        ? rawConnection.archivedAt
          ? `Disconnected ${formatDistanceToNow(new Date(rawConnection.archivedAt), { addSuffix: true })}`
          : "Homeowner disconnected"
        : "Needs follow-up",
      dot: isArchived ? "bg-gray-400" : "bg-yellow-400",
    },
  };

  const serviceStatusConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
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
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Properties", href: "/pro/contractor/properties" },
            { label: property.address || "Property" },
          ]}
        />

        {/* Archived Banner */}
        {isArchived && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-500/30 bg-gray-500/10 px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                This homeowner has disconnected. You can view work history but
                cannot submit new work or send messages.
              </p>
              {rawConnection.archivedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Disconnected{" "}
                  {formatDistanceToNow(new Date(rawConnection.archivedAt), {
                    addSuffix: true,
                  })}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 lg:flex-row">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href="/pro/contractor/properties"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to properties"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <h1 className={`text-2xl font-semibold ${heading}`}>
                    {property.address}
                  </h1>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${connectionStatus.bg} ${connectionStatus.color}`}
                  >
                    {connectionStatus.label}
                  </span>
                </div>
                <p className={textMeta}>
                  {[property.city, property.state, property.zip]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Status"
            value={healthConfig[relationshipHealth].label}
            subtext={healthConfig[relationshipHealth].subtext}
            dot={healthConfig[relationshipHealth].dot}
          />
          <StatCard
            label="Verified Jobs"
            value={connection.verifiedServiceCount}
            subtext={`$${totalRevenue.toLocaleString()} total`}
          />
          <StatCard
            label="Opportunities"
            value={isArchived ? "—" : totalOpportunities}
            subtext={isArchived ? "N/A" : totalOpportunities > 0 ? "Act now" : "None"}
            highlight={!isArchived && totalOpportunities > 0 ? "blue" : undefined}
          />
          <StatCard
            label="Pending Requests"
            value={isArchived ? "—" : pendingRequests.length}
            subtext={
              isArchived
                ? "N/A"
                : pendingRequests.length > 0
                ? "Needs response"
                : "All clear"
            }
            highlight={
              !isArchived && pendingRequests.length > 0 ? "orange" : undefined
            }
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Opportunities & Work */}
          <div className="space-y-6 lg:col-span-2">
            {/* Growth Opportunities - Only for active */}
            {!isArchived && totalOpportunities > 0 && (
              <section className={glass}>
                <div className="mb-4">
                  <h2 className={`text-lg font-semibold ${heading}`}>
                    Growth Opportunities ({totalOpportunities})
                  </h2>
                  <p className={`text-sm ${textMeta} mt-1`}>
                    Proactive outreach opportunities to grow your business
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Expiring Warranties */}
                  {expiringWarranties.map((warranty) => (
                    <div
                      key={warranty.id}
                      className="rounded-lg bg-blue-400/10 border border-blue-400/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl flex-shrink-0">🛡️</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white">
                              {warranty.item}
                            </h3>
                            <p className={`text-sm ${textMeta}`}>
                              Warranty expires{" "}
                              {format(
                                new Date(warranty.expiresAt!),
                                "MMM d, yyyy"
                              )}
                            </p>
                            {warranty.provider && (
                              <p className={`text-xs ${textMeta} mt-1`}>
                                Provider: {warranty.provider}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className="text-blue-300 font-semibold flex-shrink-0">
                          {warranty.daysUntil}d
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/pro/messages/${connection.id}?topic=warranty&item=${encodeURIComponent(warranty.item)}`}
                          className="rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 text-sm text-blue-200 hover:bg-blue-500/30 transition"
                        >
                          Send Message
                        </Link>
                      </div>
                    </div>
                  ))}

                  {/* Upcoming Reminders */}
                  {upcomingReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className="rounded-lg bg-blue-400/10 border border-blue-400/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-2xl flex-shrink-0">🔔</span>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-white">
                              {reminder.title}
                            </h3>
                            <p className={`text-sm ${textMeta}`}>
                              Due{" "}
                              {format(new Date(reminder.dueAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <span className="text-blue-300 font-semibold flex-shrink-0">
                          {reminder.daysUntil}d
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/pro/messages/${connection.id}?topic=reminder&item=${encodeURIComponent(reminder.title)}`}
                          className="rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 text-sm text-blue-200 hover:bg-blue-500/30 transition"
                        >
                          Send Message
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Request Alert - Only for active */}
            {!isArchived && pendingRequests.length > 0 && (
              <section className={glass}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 rounded-full bg-orange-500/20 p-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-5 w-5 text-orange-300"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">Action Required</h3>
                    <p className={`mt-1 text-sm ${textMeta}`}>
                      You have {pendingRequests.length} pending job{" "}
                      {pendingRequests.length === 1 ? "request" : "requests"}{" "}
                      from this homeowner.
                    </p>
                    {firstPendingRequest && (
                      <Link
                        href={`/pro/contractor/service-requests/${firstPendingRequest.id}`}
                        className={`${ctaPrimary} inline-block mt-3 px-4 py-2 text-sm`}
                      >
                        Respond to Request
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Service Requests */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${heading}`}>
                  Service Requests ({property.serviceRequests.length})
                </h2>
              </div>

              {property.serviceRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">📋</div>
                  <p className={textMeta}>No service requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.serviceRequests.map((request) => {
                    const requestStatus =
                      serviceStatusConfig[request.status] ||
                      serviceStatusConfig.PENDING;
                    return (
                      <Link
                        key={request.id}
                        href={`/pro/contractor/service-requests/${request.id}`}
                        className="block rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <h3 className="flex-1 font-semibold text-white">
                            {request.title}
                          </h3>
                          <span
                            className={`flex-shrink-0 rounded-full border px-2 py-1 text-xs ${requestStatus.bg} ${requestStatus.color}`}
                          >
                            {requestStatus.label}
                          </span>
                        </div>
                        {request.description && (
                          <p
                            className={`mb-2 line-clamp-2 text-sm ${textMeta}`}
                          >
                            {request.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                          {request.category && (
                            <span>📁 {request.category}</span>
                          )}
                          {request.urgency && (
                            <span>
                              ⚡ {request.urgency}
                              {request.urgency === "EMERGENCY" && " 🚨"}
                            </span>
                          )}
                          {(request.budgetMin || request.budgetMax) && (
                            <span>
                              💰 $
                              {Number(request.budgetMin || 0).toLocaleString()}{" "}
                              - $
                              {Number(request.budgetMax || 0).toLocaleString()}
                            </span>
                          )}
                          <span>
                            📅{" "}
                            {format(
                              new Date(request.createdAt),
                              "MMM d, yyyy"
                            )}
                          </span>
                        </div>
                        {request.quote && (
                          <div className="mt-2 text-sm font-semibold text-white">
                            Quote: $
                            {Number(request.quote.totalAmount).toLocaleString()}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Documented Work */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${heading}`}>
                  Work History ({property.serviceRecords.length})
                </h2>
              </div>

              {property.serviceRecords.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">🔧</div>
                  <p className={textMeta}>No documented service</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.serviceRecords.map((service) => (
                    <ServiceRecordCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Homeowner Info & Actions */}
          <div className="space-y-6">
            {/* Homeowner Card */}
            {property.owner && (
              <section className={glass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${heading}`}>
                    Homeowner
                  </h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full flex items-center gap-1.5 ${
                      isArchived
                        ? "bg-gray-500/20 text-gray-400"
                        : relationshipHealth === "excellent"
                        ? "bg-emerald-400/20 text-emerald-300"
                        : relationshipHealth === "good"
                        ? "bg-blue-400/20 text-blue-300"
                        : "bg-yellow-400/20 text-yellow-300"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${healthConfig[relationshipHealth].dot}`} />
                    {healthConfig[relationshipHealth].label}
                  </span>
                </div>

                <div className="flex items-start gap-3 mb-4">
                  {property.owner.image ? (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={property.owner.image}
                        alt={property.owner.name || "Homeowner"}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center text-white text-xl font-medium">
                      {(
                        property.owner.name || property.owner.email
                      )[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">
                      {property.owner.name || property.owner.email}
                    </p>
                    <p className={`mt-1 text-sm ${textMeta} truncate`}>
                      ✉️ {property.owner.email}
                    </p>
                    {isArchived && (
                      <p className="mt-1 text-xs text-gray-500">
                        Connection ended
                      </p>
                    )}
                  </div>
                </div>

                {/* Relationship Metrics */}
                <div className="space-y-2 border-t border-white/10 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className={textMeta}>Connected</span>
                    <span className="text-white">{daysSinceConnection} days</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={textMeta}>Last Contact</span>
                    <span className="text-white">
                      {daysSinceLastService !== null
                        ? `${daysSinceLastService} days ago`
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={textMeta}>Verified Jobs</span>
                    <span className="text-white">
                      {connection.verifiedServiceCount}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={textMeta}>Lifetime Value</span>
                    <span className="text-green-300 font-medium">
                      ${totalRevenue.toLocaleString()}
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* Quick Actions - Only for active */}
            {!isArchived && property.owner && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  {/* Priority action: Pending request */}
                  {pendingRequests.length > 0 && firstPendingRequest && (
                    <Link
                      href={`/pro/contractor/service-requests/${firstPendingRequest.id}`}
                      className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition border-orange-400/30`}
                    >
                      <span className="text-xl">📋</span>
                      <span className="text-sm text-white">
                        Respond to Request
                      </span>
                    </Link>
                  )}

                  {/* Document work */}
                  <Link
                    href={`/pro/contractor/service-records/new?homeId=${id}`}
                    className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                  >
                    <span className="text-xl">📝</span>
                    <span className="text-sm text-white">
                      Document New Work
                    </span>
                  </Link>

                  {/* Message - with context hint if applicable */}
                  <Link
                    href={`/pro/messages/${connection.id}${
                      expiringWarranties[0]
                        ? `?topic=warranty&item=${encodeURIComponent(expiringWarranties[0].item)}`
                        : daysSinceLastService && daysSinceLastService > 90
                        ? "?topic=checkin"
                        : ""
                    }`}
                    className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                  >
                    <span className="text-xl">💬</span>
                    <span className="text-sm text-white">
                      {expiringWarranties[0]
                        ? "Message About Warranty"
                        : daysSinceLastService && daysSinceLastService > 90
                        ? "Send Check-in"
                        : "Send Message"}
                    </span>
                  </Link>
                </div>
              </section>
            )}

            {/* Read-only notice for archived */}
            {isArchived && (
              <section className={glass}>
                <div className="text-center py-4">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-sm text-gray-400">
                    This connection is archived. You can view work history but
                    actions are disabled.
                  </p>
                  <Link
                    href={`/pro/messages/${connection.id}`}
                    className="inline-block mt-3 text-sm text-gray-400 hover:text-gray-300 underline"
                  >
                    View message history →
                  </Link>
                </div>
              </section>
            )}

            {/* Property Details */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Property Details
              </h2>
              <dl className="space-y-2">
                <div>
                  <dt className={`text-xs ${textMeta}`}>Address</dt>
                  <dd className="text-sm text-white">{addrLine}</dd>
                </div>
                {property.apn && (
                  <div>
                    <dt className={`text-xs ${textMeta}`}>APN</dt>
                    <dd className="text-sm text-white">{property.apn}</dd>
                  </div>
                )}
                {property.county && (
                  <div>
                    <dt className={`text-xs ${textMeta}`}>County</dt>
                    <dd className="text-sm text-white">{property.county}</dd>
                  </div>
                )}
              </dl>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

async function ServiceRecordCard({
  service,
}: {
  service: {
    id: string;
    serviceType: string;
    serviceDate: Date | null;
    cost: { toNumber: () => number } | null;
    status: string;
    description: string | null;
    photos: string[];
    createdAt: Date;
  };
}) {
  // Sign first photo if available
  let photoUrl: string | null = null;
  if (service.photos && service.photos.length > 0) {
    const key = extractS3Key(service.photos[0]);
    photoUrl = await getSignedGetUrl(key);
  }

  return (
    <Link
      href={`/pro/contractor/work/${service.id}`}
      className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
    >
      {photoUrl && (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={photoUrl}
            alt={service.serviceType}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-white">{service.serviceType}</h3>
        {service.description && (
          <p className={`mt-1 line-clamp-2 text-sm ${textMeta}`}>
            {service.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
          {service.serviceDate && (
            <span>📅 {format(new Date(service.serviceDate), "MMM d, yyyy")}</span>
          )}
          {service.cost && (
            <span className="font-semibold text-white">
              $
              {typeof service.cost === "object" && "toNumber" in service.cost
                ? service.cost.toNumber().toLocaleString()
                : Number(service.cost).toLocaleString()}
            </span>
          )}
          {service.photos && service.photos.length > 0 && (
            <span>📷 {service.photos.length}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  label,
  value,
  subtext,
  highlight,
  dot,
}: {
  label: string;
  value: string | number | React.ReactNode;
  subtext?: string;
  highlight?: "red" | "yellow" | "blue" | "orange";
  dot?: string;
}) {
  return (
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold flex items-center gap-2 ${
          highlight === "red"
            ? "text-red-400"
            : highlight === "yellow"
            ? "text-yellow-400"
            : highlight === "blue"
            ? "text-blue-400"
            : highlight === "orange"
            ? "text-orange-400"
            : "text-white"
        }`}
      >
        {dot && <span className={`w-2.5 h-2.5 rounded-full ${dot} flex-shrink-0`} />}
        {value}
      </div>
      {subtext && (
        <div className="mt-0.5 text-xs text-white/60">{subtext}</div>
      )}
    </div>
  );
}