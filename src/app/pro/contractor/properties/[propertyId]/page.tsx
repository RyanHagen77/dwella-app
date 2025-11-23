/**
 * PROPERTY DETAIL PAGE (CONTRACTOR) - IMPROVED
 *
 * Relationship-centered view with:
 * - Growth opportunities (warranties, reminders)
 * - Relationship health indicators
 * - Context-aware quick actions
 * - Enhanced stats and metrics
 * - Timeline view option
 * - Private notes
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";
import { serializeConnections } from "@/lib/serialize";
import Image from "next/image";
import Link from "next/link";
import { glass, glassTight, heading, textMeta, ctaPrimary } from "@/lib/glass";
import { format } from "date-fns";
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
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          verifiedWorkCount: true,
          totalSpent: true,
          lastWorkDate: true,
        },
      },
      workRecords: {
        where: {
          contractorId: session.user.id,
        },
        orderBy: {
          workDate: "desc",
        },
        select: {
          id: true,
          workType: true,
          workDate: true,
          cost: true,
          status: true,
          description: true,
          photos: true,
          createdAt: true,
        },
      },
      jobRequests: {
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
      // NEW: Fetch opportunities
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

  const addrLine = [property.address, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  // Use property photo if available
  let headerImageUrl: string | null = null;
  if (property.photos && property.photos.length > 0) {
    const key = extractS3Key(property.photos[0]);
    headerImageUrl = await getSignedGetUrl(key);
  }

  // Calculate relationship metrics
  const now = Date.now();
  const daysSinceConnection = Math.floor(
    (now - new Date(connection.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const daysSinceLastWork = connection.lastWorkDate
    ? Math.floor((now - new Date(connection.lastWorkDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const relationshipHealth: 'excellent' | 'good' | 'needs-attention' =
    !daysSinceLastWork || daysSinceLastWork > 180
      ? 'needs-attention'
      : daysSinceLastWork < 90
      ? 'excellent'
      : 'good';

  // Process opportunities with days until
  const expiringWarranties = property.warranties.map(w => ({
    ...w,
    daysUntil: Math.ceil((new Date(w.expiresAt!).getTime() - now) / (1000 * 60 * 60 * 24)),
  }));

  const upcomingReminders = property.reminders.map(r => ({
    ...r,
    daysUntil: Math.ceil((new Date(r.dueAt).getTime() - now) / (1000 * 60 * 60 * 24)),
  }));

  const totalOpportunities = expiringWarranties.length + upcomingReminders.length;

  // Calculate stats
  const totalRevenue = connection.totalSpent || 0;
  const pendingRequests = property.jobRequests.filter(
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

  const connectionStatus = statusConfig[connection.status] || statusConfig.ACTIVE;

  const healthConfig = {
    excellent: { label: '🟢 Great', subtext: 'Engaged client' },
    good: { label: '🔵 Good', subtext: 'Active relationship' },
    'needs-attention': { label: '🟡 At Risk', subtext: 'Needs follow-up' },
  };

  const jobStatusConfig: Record<
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
      <Bg imageUrl={headerImageUrl} />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Properties", href: "/pro/contractor/properties" },
            { label: addrLine },
          ]}
        />

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

        {/* Improved Stats Overview - Relationship Story */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard
            label="Relationship Health"
            value={healthConfig[relationshipHealth].label}
            subtext={daysSinceLastWork !== null ? `${daysSinceLastWork}d since contact` : 'No contact yet'}
          />
          <StatCard
            label="Verified Jobs"
            value={connection.verifiedWorkCount}
            subtext={`$${totalRevenue.toLocaleString()} total`}
          />
          <StatCard
            label="Opportunities"
            value={totalOpportunities}
            subtext={totalOpportunities > 0 ? "Act now" : "None"}
            highlight={totalOpportunities > 0 ? "blue" : undefined}
          />
          <StatCard
            label="Pending Requests"
            value={pendingRequests.length}
            subtext={pendingRequests.length > 0 ? "Needs response" : "All clear"}
            highlight={pendingRequests.length > 0 ? "orange" : undefined}
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Opportunities & Work */}
          <div className="space-y-6 lg:col-span-2">
            {/* Growth Opportunities - NEW & PROMINENT */}
            {totalOpportunities > 0 && (
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
                              {format(new Date(warranty.expiresAt!), "MMM d, yyyy")}
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
                          href={`/pro/contractor/job-requests/new?homeId=${id}&type=warranty&item=${encodeURIComponent(warranty.item)}`}
                          className="rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 text-sm text-blue-200 hover:bg-blue-500/30 transition"
                        >
                          Schedule Check-up
                        </Link>
                        <Link
                          href={`/pro/contractor/messages/${connection.id}?topic=warranty&item=${encodeURIComponent(warranty.item)}`}
                          className="rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/15 transition"
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
                              Due {format(new Date(reminder.dueAt), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <span className="text-blue-300 font-semibold flex-shrink-0">
                          {reminder.daysUntil}d
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/pro/contractor/job-requests/new?homeId=${id}&type=reminder&item=${encodeURIComponent(reminder.title)}`}
                          className="rounded-lg bg-blue-500/20 border border-blue-400/30 px-3 py-1.5 text-sm text-blue-200 hover:bg-blue-500/30 transition"
                        >
                          Offer Service
                        </Link>
                        <Link
                          href={`/pro/contractor/messages/${connection.id}?topic=reminder&item=${encodeURIComponent(reminder.title)}`}
                          className="rounded-lg bg-white/10 border border-white/20 px-3 py-1.5 text-sm text-white hover:bg-white/15 transition"
                        >
                          Send Message
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Request Alert */}
            {pendingRequests.length > 0 && (
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
                      {pendingRequests.length === 1 ? "request" : "requests"} from this
                      homeowner.
                    </p>
                    {firstPendingRequest && (
                      <Link
                        href={`/pro/contractor/job-requests/${firstPendingRequest.id}`}
                        className={`${ctaPrimary} inline-block mt-3 px-4 py-2 text-sm`}
                      >
                        Respond to Request
                      </Link>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* Job Requests */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-lg font-semibold ${heading}`}>
                  Job Requests ({property.jobRequests.length})
                </h2>
              </div>

              {property.jobRequests.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">📋</div>
                  <p className={textMeta}>No job requests yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.jobRequests.map((request) => {
                    const requestStatus =
                      jobStatusConfig[request.status] || jobStatusConfig.PENDING;
                    return (
                      <Link
                        key={request.id}
                        href={`/pro/contractor/job-requests/${request.id}`}
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
                          <p className={`mb-2 line-clamp-2 text-sm ${textMeta}`}>
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
                            {format(new Date(request.createdAt), "MMM d, yyyy")}
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
                  Work History ({property.workRecords.length})
                </h2>
              </div>

              {property.workRecords.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="mb-3 text-4xl">🔧</div>
                  <p className={textMeta}>No documented work yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {property.workRecords.map((work) => (
                    <WorkRecordCard key={work.id} work={work} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Homeowner Info & Actions */}
          <div className="space-y-6">
            {/* Enhanced Homeowner Card */}
            {property.owner && (
              <section className={glass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${heading}`}>Homeowner</h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      relationshipHealth === 'excellent'
                        ? 'bg-emerald-400/20 text-emerald-300'
                        : relationshipHealth === 'good'
                        ? 'bg-blue-400/20 text-blue-300'
                        : 'bg-yellow-400/20 text-yellow-300'
                    }`}
                  >
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
                      {(property.owner.name || property.owner.email)[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">
                      {property.owner.name || property.owner.email}
                    </p>
                    <p className={`mt-1 text-sm ${textMeta} truncate`}>
                      ✉️ {property.owner.email}
                    </p>
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
                      {daysSinceLastWork !== null ? `${daysSinceLastWork} days ago` : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={textMeta}>Verified Jobs</span>
                    <span className="text-white">{connection.verifiedWorkCount}</span>
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

            {/* Context-Aware Quick Actions */}
            {property.owner && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  {/* Context-specific actions */}
                  {totalOpportunities > 0 && expiringWarranties[0] && (
                    <Link
                      href={`/pro/contractor/messages/${connection.id}?topic=warranty&item=${encodeURIComponent(expiringWarranties[0].item)}`}
                      className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                    >
                      <span className="text-xl">💬</span>
                      <span className="text-sm text-white">
                        Message About Warranty
                      </span>
                    </Link>
                  )}

                  {pendingRequests.length > 0 && firstPendingRequest && (
                    <Link
                      href={`/pro/contractor/job-requests/${firstPendingRequest.id}`}
                      className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                    >
                      <span className="text-xl">📋</span>
                      <span className="text-sm text-white">
                        Respond to Request
                      </span>
                    </Link>
                  )}

                  {daysSinceLastWork && daysSinceLastWork > 90 && (
                    <Link
                      href={`/pro/contractor/messages/${connection.id}?topic=checkin`}
                      className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                    >
                      <span className="text-xl">💬</span>
                      <span className="text-sm text-white">
                        Send Check-in
                      </span>
                    </Link>
                  )}

                  {/* Always available actions */}
                  <Link
                    href={`/pro/contractor/work-records/new?homeId=${id}`}
                    className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                  >
                    <span className="text-xl">📝</span>
                    <span className="text-sm text-white">Document New Work</span>
                  </Link>

                  <Link
                    href={`/pro/messages/${connection.id}`}
                    className={`${glassTight} flex items-center gap-3 px-3 py-2 hover:bg-white/10 transition`}
                  >
                    <span className="text-xl">💬</span>
                    <span className="text-sm text-white">Send Message</span>
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

async function WorkRecordCard({
  work,
}: {
  work: {
    id: string;
    workType: string;
    workDate: Date | null;
    cost: { toNumber: () => number } | null;
    status: string;
    description: string | null;
    photos: string[];
    createdAt: Date;
  };
}) {
  // Sign first photo if available
  let photoUrl: string | null = null;
  if (work.photos && work.photos.length > 0) {
    const key = extractS3Key(work.photos[0]);
    photoUrl = await getSignedGetUrl(key);
  }

  return (
    <Link
      href={`/pro/contractor/work/${work.id}`}
      className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
    >
      {photoUrl && (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
          <Image
            src={photoUrl}
            alt={work.workType}
            fill
            className="object-cover"
            sizes="80px"
          />
        </div>
      )}
      <div className="flex-1">
        <h3 className="font-semibold text-white">{work.workType}</h3>
        {work.description && (
          <p className={`mt-1 line-clamp-2 text-sm ${textMeta}`}>
            {work.description}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-white/60">
          {work.workDate && (
            <span>📅 {format(new Date(work.workDate), "MMM d, yyyy")}</span>
          )}
          {work.cost && (
            <span className="font-semibold text-white">
              ${typeof work.cost === 'object' && 'toNumber' in work.cost
                ? work.cost.toNumber().toLocaleString()
                : Number(work.cost).toLocaleString()}
            </span>
          )}
          {work.photos && work.photos.length > 0 && (
            <span>📷 {work.photos.length}</span>
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
}: {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: "red" | "yellow" | "blue" | "orange";
}) {
  return (
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold ${
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
        {value}
      </div>
      {subtext && (
        <div className="mt-0.5 text-xs text-white/60">{subtext}</div>
      )}
    </div>
  );
}

function Bg({ imageUrl }: { imageUrl: string | null }) {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src={imageUrl || "/myhomedox_home3.webp"}
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