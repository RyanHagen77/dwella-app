/**
 * JOB REQUEST DETAIL PAGE (HOMEOWNER)
 *
 * View single job request, accept quotes, cancel request
 * WITH PHOTO GALLERY
 *
 * Location: app/home/[homeId]/job-requests/[id]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { format } from "date-fns";
import { JobRequestActions } from "../_components/JobRequestActions";
import type { JobRequestForActions } from "../_types";
import Breadcrumb from "@/components/ui/Breadcrumb";


type PageProps = {
  params: Promise<{ homeId: string; id: string }>;
};

export default async function JobRequestDetailPage({ params }: PageProps) {
  const { homeId, id } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  await requireHomeAccess(homeId, session.user.id);

  const jobRequest = await prisma.jobRequest.findUnique({
    where: { id },
    include: {
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
              phone: true,
              verified: true,
              rating: true,
              completedJobs: true,
            },
          },
        },
      },
      quote: {
        include: {
          items: true,
        },
      },
      workRecord: {
        select: {
          id: true,
          workType: true,
          workDate: true,
          status: true,
          cost: true,
        },
      },
    },
  });

  if (!jobRequest) {
    notFound();
  }

  // Verify ownership
  if (
    jobRequest.homeId !== homeId ||
    jobRequest.homeownerId !== session.user.id
  ) {
    redirect(`/home/${homeId}`);
  }

  // Sign photo URLs from S3
  const signedPhotos = await Promise.all(
    (jobRequest.photos || []).map(async (url) => {
      const key = extractS3Key(url);
      return await getSignedGetUrl(key);
    })
  );

  const addrLine = [jobRequest.home.address, jobRequest.home.city, jobRequest.home.state]
    .filter(Boolean)
    .join(", ");

  const statusConfig: Record<
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

  const status = statusConfig[jobRequest.status] || statusConfig.PENDING;

  // Plain, serializable subset for the client Actions component
  const jobRequestForActions: JobRequestForActions = {
    id: jobRequest.id,
    status: jobRequest.status,
    quoteId: jobRequest.quoteId,
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Requests & Submissions", href: `/home/${homeId}/completed-work-submissions` },
            { label: jobRequest.title },
          ]}
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
            <div className="flex flex-1 min-w-0 items-center gap-3">
              <Link
                href={`/home/${homeId}/completed-work-submissions`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to job requests"
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
                  <h1
                    className={`truncate text-2xl font-semibold ${heading}`}
                  >
                    {jobRequest.title}
                  </h1>
                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-medium ${status.bg} ${status.color}`}
                  >
                    {status.label}
                  </span>
                </div>
                <p className={textMeta}>{addrLine}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Request Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Description
              </h2>
              <p className="whitespace-pre-wrap text-white/90">
                {jobRequest.description}
              </p>
            </section>

            {/* Photos Gallery */}
            {signedPhotos.length > 0 && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Photos ({signedPhotos.length})
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {signedPhotos.map((photoUrl, index) => (
                    <a
                      key={index}
                      href={photoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                    >
                      <Image
                        src={photoUrl}
                        alt={`Job request photo ${index + 1}`}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 transition group-hover:opacity-100" />
                      <div className="absolute bottom-2 right-2 opacity-0 transition group-hover:opacity-100">
                        <span className="rounded-full bg-white/20 px-2 py-1 text-xs text-white backdrop-blur-sm">
                          View Full Size
                        </span>
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Details */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Request Details
              </h2>
              <dl className="space-y-3">
                {jobRequest.category && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Category:</dt>
                    <dd className="text-white">{jobRequest.category}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Urgency:</dt>
                  <dd className="text-white">
                    {jobRequest.urgency}
                    {jobRequest.urgency === "EMERGENCY" && " 🚨"}
                  </dd>
                </div>
                {(jobRequest.budgetMin || jobRequest.budgetMax) && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Budget Range:</dt>
                    <dd className="text-white">
                      $
                      {Number(jobRequest.budgetMin || 0).toLocaleString()} - $
                      {Number(jobRequest.budgetMax || 0).toLocaleString()}
                    </dd>
                  </div>
                )}
                {jobRequest.desiredDate && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Preferred Date:</dt>
                    <dd className="text-white">
                      {format(
                        new Date(jobRequest.desiredDate),
                        "MMM d, yyyy"
                      )}
                    </dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Requested:</dt>
                  <dd className="text-white">
                    {format(
                      new Date(jobRequest.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </dd>
                </div>
                {jobRequest.respondedAt && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Responded:</dt>
                    <dd className="text-white">
                      {format(
                        new Date(jobRequest.respondedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Contractor Notes */}
            {jobRequest.contractorNotes && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Contractor Notes
                </h2>
                <p className="whitespace-pre-wrap text-white/90">
                  {jobRequest.contractorNotes}
                </p>
              </section>
            )}

            {/* Quote */}
            {jobRequest.quote && (
              <section className={glass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${heading}`}>Quote</h2>
                  <span className="text-2xl font-bold text-white">
                    ${Number(jobRequest.quote.totalAmount).toLocaleString()}
                  </span>
                </div>

                {jobRequest.quote.description && (
                  <p className={`mb-4 ${textMeta}`}>
                    {jobRequest.quote.description}
                  </p>
                )}

                {jobRequest.quote.items &&
                  jobRequest.quote.items.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white/80">
                        Line Items:
                      </h3>
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        {jobRequest.quote.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0"
                          >
                            <div className="flex-1">
                              <p className="text-sm text-white">{item.item}</p>
                              <p className={`text-xs ${textMeta}`}>
                                {Number(item.qty)} × $
                                {Number(item.unitPrice).toLocaleString()}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-white">
                              ${Number(item.total).toLocaleString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {jobRequest.quote.expiresAt && (
                  <p className={`mt-4 text-xs ${textMeta}`}>
                    Quote expires:{" "}
                    {format(
                      new Date(jobRequest.quote.expiresAt),
                      "MMM d, yyyy"
                    )}
                  </p>
                )}
              </section>
            )}

            {/* Work Record */}
            {jobRequest.workRecord && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Work Completed
                </h2>
                <Link
                  href={`/home/${homeId}/work/${jobRequest.workRecord.id}`}
                  className="block rounded-lg border border-white/10 bg-white/5 p-4 hover:bg-white/10"
                >
                  <p className="font-medium text-white">
                    {jobRequest.workRecord.workType}
                  </p>
                  {jobRequest.workRecord.workDate && (
                    <p className={`text-sm ${textMeta}`}>
                      Completed:{" "}
                      {format(
                        new Date(jobRequest.workRecord.workDate),
                        "MMM d, yyyy"
                      )}
                    </p>
                  )}
                  {jobRequest.workRecord.cost && (
                    <p className="mt-2 text-lg font-semibold text-white">
                      ${Number(jobRequest.workRecord.cost).toLocaleString()}
                    </p>
                  )}
                </Link>
              </section>
            )}
          </div>

          {/* Right Column - Actions & Contractor */}
          <div className="space-y-6">
            {/* Actions card (client) */}
            <JobRequestActions jobRequest={jobRequestForActions} homeId={homeId} />

            {/* Contractor card */}
            {jobRequest.contractor && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Contractor
                </h2>
                <div className="flex items-start gap-3">
                  {jobRequest.contractor.image && (
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                      <Image
                        src={jobRequest.contractor.image}
                        alt={jobRequest.contractor.name || "Contractor"}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {jobRequest.contractor.proProfile?.businessName ||
                        jobRequest.contractor.name}
                      {jobRequest.contractor.proProfile?.verified && (
                        <span className="ml-2 text-xs text-green-400">
                          ✓ Verified
                        </span>
                      )}
                    </p>
                    {jobRequest.contractor.proProfile?.rating && (
                      <p className={`text-sm ${textMeta}`}>
                        ⭐{" "}
                        {jobRequest.contractor.proProfile.rating.toFixed(1)}{" "}
                        rating
                      </p>
                    )}
                    {jobRequest.contractor.proProfile?.completedJobs && (
                      <p className={`text-sm ${textMeta}`}>
                        {jobRequest.contractor.proProfile.completedJobs} jobs
                        completed
                      </p>
                    )}
                    {jobRequest.contractor.proProfile?.phone && (
                      <p className={`mt-2 text-sm ${textMeta}`}>
                        📞 {jobRequest.contractor.proProfile.phone}
                      </p>
                    )}
                    <p className={`text-sm ${textMeta}`}>
                      ✉️ {jobRequest.contractor.email}
                    </p>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </main>
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