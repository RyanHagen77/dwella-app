/**
 * PROPERTY DETAIL PAGE (CONTRACTOR)
 *
 * View single property with:
 * - Property overview and homeowner info
 * - Message alerts/notifications
 * - Documented work history
 * - Job requests from this homeowner
 * - Future: automated reminder settings
 *
 * Location: app/pro/contractor/properties/[id]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";
import Image from "next/image";
import Link from "next/link";
import { glass, glassTight, heading, textMeta } from "@/lib/glass";
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

  // Fetch property with all related data
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
    },
  });

  if (!property) {
    notFound();
  }

  // Verify contractor has access to this property
  const connection = property.connections[0];
  if (!connection) {
    redirect("/pro/contractor/properties");
  }

  const addrLine = [property.address, property.city, property.state, property.zip]
    .filter(Boolean)
    .join(", ");

  // Use property photo if available, otherwise use default
  let headerImageUrl: string | null = null;
  if (property.photos && property.photos.length > 0) {
    const key = extractS3Key(property.photos[0]);
    headerImageUrl = await getSignedGetUrl(key);
  }

  // Calculate stats
  const totalJobs = property.workRecords.length;
  const totalRevenue = property.workRecords.reduce(
    (sum, work) => sum + Number(work.cost || 0),
    0
  );
  const pendingRequests = property.jobRequests.filter(
    (req) => req.status === "PENDING" || req.status === "QUOTED"
  ).length;
  const lastWorkDate = property.workRecords[0]?.workDate || null;

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

        {/* Stats Overview */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Jobs" value={totalJobs} />
          <StatCard
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
          />
          <StatCard
            label="Pending Requests"
            value={pendingRequests}
            highlight={pendingRequests > 0 ? "yellow" : undefined}
          />
          <StatCard
            label="Last Work"
            value={
              lastWorkDate
                ? format(new Date(lastWorkDate), "MMM d, yyyy")
                : "None"
            }
          />
        </section>

        {/* Message Alerts - Phase 2 placeholder */}
        {pendingRequests > 0 && (
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
                  You have {pendingRequests} pending job{" "}
                  {pendingRequests === 1 ? "request" : "requests"} from this
                  homeowner. Review and respond below.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Work & Requests */}
          <div className="space-y-6 lg:col-span-2">
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
                    <WorkRecordCard
                      key={work.id}
                      work={work}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Phase 2: Automated Reminders Placeholder */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Automated Reminders
              </h2>
              <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
                <div className="mb-3 text-4xl">🔔</div>
                <p className="mb-2 font-medium text-white">
                  Coming in Phase 2
                </p>
                <p className={`text-sm ${textMeta}`}>
                  Set up automated maintenance reminders for your clients. Keep
                  them engaged and ensure repeat business.
                </p>
              </div>
            </section>
          </div>

          {/* Right Column - Homeowner Info */}
          <div className="space-y-6">
            {/* Homeowner card */}
            {property.owner && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Homeowner
                </h2>
                <div className="flex items-start gap-3">
                  {property.owner.image && (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={property.owner.image}
                        alt={property.owner.name || "Homeowner"}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {property.owner.name}
                    </p>
                    <p className={`mt-1 text-sm ${textMeta}`}>
                      ✉️ {property.owner.email}
                    </p>
                    <p className={`mt-1 text-xs ${textMeta}`}>
                      Connected since{" "}
                      {format(new Date(connection.createdAt), "MMM d, yyyy")}
                    </p>
                  </div>
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

            {/* Quick Actions */}
            {property.owner ? (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Quick Actions
                </h2>
                <div className="space-y-2">
                  <Link
                    href={`mailto:${property.owner.email}`}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                    Email Homeowner
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm transition hover:bg-white/10"
                    disabled
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                      />
                    </svg>
                    Message (Coming Soon)
                  </button>
                </div>
              </section>
            ) : null}
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
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "red" | "yellow";
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
            : "text-white"
        }`}
      >
        {value}
      </div>
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