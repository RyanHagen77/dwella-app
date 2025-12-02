/**
 * JOB REQUEST DETAIL PAGE (CONTRACTOR)
 *
 * View job request from homeowner, submit quote
 *
 * Location: app/contractor/service-requests/[workId]/page.tsx
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
import { ContractorServiceRequestActions } from "../../../_components/ContractorServiceRequestActions";
import type { Decimal } from "@prisma/client/runtime/library";

type PageProps = {
  params: Promise<{ id: string }>;
};

type QuoteItemForDisplay = {
  id: string;
  item: string;
  qty: Decimal;
  unitPrice: Decimal;
  total: Decimal;
};

type ServiceRequestForContractorActions = {
  id: string;
  status: string;
  quote: { id: string } | null;
  workRecord: { id: string } | null;
  contractorNotes: string | null;
};

export default async function ContractorServiceRequestDetailPage({
  params,
}: PageProps) {
  const { id } = await params;
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

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: {
      id,
      contractorId: session.user.id,
    },
    include: {
      home: {
        select: {
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
      homeowner: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      connection: {
        select: {
          id: true,
          status: true,
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

  if (!serviceRequest) {
    notFound();
  }

  // Verify contractor assignment
  if (serviceRequest.contractorId !== session.user.id) {
    redirect("/pro/contractor");
  }

  // Sign photo URLs
  const signedPhotos = await Promise.all(
    (serviceRequest.photos || []).map(async (url) => {
      const key = extractS3Key(url);
      return await getSignedGetUrl(key);
    })
  );

  // Plain object for the client actions component (no Decimals)
  const serviceRequestForActions: ServiceRequestForContractorActions = {
    id: serviceRequest.id,
    status: serviceRequest.status,
    quote: serviceRequest.quote ? { id: serviceRequest.quote.id } : null,
    workRecord: serviceRequest.workRecord
      ? { id: serviceRequest.workRecord.id }
      : null,
    contractorNotes: serviceRequest.contractorNotes,
  };

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

  const status = statusConfig[serviceRequest.status] || statusConfig.PENDING;

  const addrLine = [
    serviceRequest.home.address,
    serviceRequest.home.city,
    serviceRequest.home.state,
    serviceRequest.home.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const title = serviceRequest.title || "Job Request";

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <Link
            href="/pro/contractor/service-requests"
            className="text-white/70 hover:text-white transition-colors"
          >
            Job Requests
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white truncate max-w-[50%]">
            {title}
          </span>
        </nav>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/pro/contractor/service-requests"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to job requests"
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
                <h1 className={`text-2xl font-bold ${heading} truncate`}>
                  {title}
                </h1>
                <p className={`text-sm ${textMeta} mt-1`}>{addrLine}</p>
              </div>
            </div>

            <span
              className={`flex-shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${status.bg} ${status.color}`}
            >
              {status.label}
            </span>
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
                {serviceRequest.description}
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
                {serviceRequest.category && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Category:</dt>
                    <dd className="text-white">{serviceRequest.category}</dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Urgency:</dt>
                  <dd className="text-white">
                    {serviceRequest.urgency}
                    {serviceRequest.urgency === "EMERGENCY" && " 🚨"}
                  </dd>
                </div>
                {(serviceRequest.budgetMin || serviceRequest.budgetMax) && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Budget Range:</dt>
                    <dd className="text-white">
                      $
                      {Number(serviceRequest.budgetMin || 0).toLocaleString()} - $
                      {Number(serviceRequest.budgetMax || 0).toLocaleString()}
                    </dd>
                  </div>
                )}
                {serviceRequest.desiredDate && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Preferred Date:</dt>
                    <dd className="text-white">
                      {format(
                        new Date(serviceRequest.desiredDate),
                        "MMM d, yyyy"
                      )}
                    </dd>
                  </div>
                )}
                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Requested:</dt>
                  <dd className="text-white">
                    {format(
                      new Date(serviceRequest.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </dd>
                </div>
                {serviceRequest.respondedAt && (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Responded:</dt>
                    <dd className="text-white">
                      {format(
                        new Date(serviceRequest.respondedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* Your Notes */}
            {serviceRequest.contractorNotes && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Your Notes
                </h2>
                <p className="whitespace-pre-wrap text-white/90">
                  {serviceRequest.contractorNotes}
                </p>
              </section>
            )}

            {/* Your Quote */}
            {serviceRequest.quote && (
              <section className={glass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${heading}`}>
                    Your Quote
                  </h2>
                  <span className="text-2xl font-bold text-white">
                    ${Number(serviceRequest.quote.totalAmount).toLocaleString()}
                  </span>
                </div>

                {serviceRequest.quote.description && (
                  <p className={`mb-4 ${textMeta}`}>
                    {serviceRequest.quote.description}
                  </p>
                )}

                {serviceRequest.quote.items &&
                  serviceRequest.quote.items.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-white/80">
                        Line Items:
                      </h3>
                      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                        {serviceRequest.quote.items.map(
                          (item: QuoteItemForDisplay) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0"
                            >
                              <div className="flex-1">
                                <p className="text-sm text-white">
                                  {item.item}
                                </p>
                                <p className={`text-xs ${textMeta}`}>
                                  {Number(item.qty)} × $
                                  {Number(
                                    item.unitPrice
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-white">
                                ${Number(item.total).toLocaleString()}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {serviceRequest.quote.expiresAt && (
                  <p className={`mt-4 text-xs ${textMeta}`}>
                    Quote expires:{" "}
                    {format(
                      new Date(serviceRequest.quote.expiresAt),
                      "MMM d, yyyy"
                    )}
                  </p>
                )}
              </section>
            )}

            {/* Work Record */}
            {serviceRequest.workRecord && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                  Work Completed
                </h2>
                <Link
                  href={`/pro/contractor/work/${serviceRequest.workRecord.id}`}
                  className={`${glassTight} block hover:bg-white/10`}
                >
                  <p className="font-medium text-white">
                    {serviceRequest.workRecord.workType}
                  </p>
                  {serviceRequest.workRecord.workDate && (
                    <p className={`mt-1 text-sm ${textMeta}`}>
                      Completed:{" "}
                      {format(
                        new Date(serviceRequest.workRecord.workDate),
                        "MMM d, yyyy"
                      )}
                    </p>
                  )}
                  {serviceRequest.workRecord.cost && (
                    <p className="mt-2 text-lg font-semibold text-white">
                      ${Number(serviceRequest.workRecord.cost).toLocaleString()}
                    </p>
                  )}
                </Link>
              </section>
            )}
          </div>

          {/* Right Column - Homeowner & Actions */}
          <div className="space-y-6">
            {/* Homeowner Card */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
                Homeowner
              </h2>
              <div className="flex items-start gap-3">
                {serviceRequest.homeowner.image ? (
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={serviceRequest.homeowner.image}
                      alt={serviceRequest.homeowner.name || "Homeowner"}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-2xl font-medium">
                      {(serviceRequest.homeowner.name ||
                        "H")[0]?.toUpperCase() || "H"}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {serviceRequest.homeowner.name || "Homeowner"}
                  </p>
                  <p className={`text-sm ${textMeta}`}>
                    ✉️ {serviceRequest.homeowner.email}
                  </p>
                </div>
              </div>
            </section>

            {/* Actions (client component gets plain, serialized subset) */}
            <ContractorServiceRequestActions serviceRequest={serviceRequestForActions} />
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