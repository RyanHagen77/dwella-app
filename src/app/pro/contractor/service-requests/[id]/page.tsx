/**
 * JOB REQUEST DETAIL PAGE (CONTRACTOR)
 *
 * View job request from homeowner, submit quote
 *
 * Location: app/pro/contractor/service-requests/[id]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { getSignedGetUrl, extractS3Key } from "@/lib/s3";
import Image from "next/image";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, glassTight, heading, textMeta } from "@/lib/glass";
import { format } from "date-fns";
import { ContractorServiceRequestActions } from "../../../_components/ContractorServiceRequestActions";
import type { Decimal } from "@prisma/client/runtime/library";

type PageProps = {
  params: { id: string };
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
  serviceRecord: { id: string } | null;
  contractorNotes: string | null;
};

export default async function ContractorServiceRequestDetailPage({ params }: PageProps) {
  const { id } = params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  const serviceRequest = await prisma.serviceRequest.findFirst({
    where: { id, contractorId: session.user.id },
    include: {
      home: { select: { address: true, city: true, state: true, zip: true } },
      homeowner: { select: { id: true, name: true, email: true, image: true } },
      connection: { select: { id: true, status: true } },
      quote: { include: { items: true } },
      serviceRecord: { select: { id: true, serviceType: true, serviceDate: true, status: true, cost: true } },
    },
  });

  if (!serviceRequest) notFound();

  // Sign photo URLs
  const signedPhotos = await Promise.all(
    (serviceRequest.photos || []).map(async (url) => {
      const key = extractS3Key(url);
      return await getSignedGetUrl(key);
    })
  );

  const serviceRequestForActions: ServiceRequestForContractorActions = {
    id: serviceRequest.id,
    status: serviceRequest.status,
    quote: serviceRequest.quote ? { id: serviceRequest.quote.id } : null,
    serviceRecord: serviceRequest.serviceRecord ? { id: serviceRequest.serviceRecord.id } : null,
    contractorNotes: serviceRequest.contractorNotes,
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: "Pending", color: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/30" },
    QUOTED: { label: "Quoted", color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/30" },
    ACCEPTED: { label: "Accepted", color: "text-green-300", bg: "bg-green-500/10 border-green-500/30" },
    IN_PROGRESS: { label: "In Progress", color: "text-purple-300", bg: "bg-purple-500/10 border-purple-500/30" },
    COMPLETED: { label: "Completed", color: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/30" },
    DECLINED: { label: "Declined", color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/30" },
    CANCELLED: { label: "Cancelled", color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/30" },
  };

  const status = statusConfig[serviceRequest.status] || statusConfig.PENDING;

  const addrLine = [serviceRequest.home.address, serviceRequest.home.city, serviceRequest.home.state, serviceRequest.home.zip]
    .filter(Boolean)
    .join(", ");

  const title = serviceRequest.title || "Job Request";

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb */}
        <div className="px-4">
          <Breadcrumb href="/pro/contractor/service-requests" label="Service Requests" current={title} />
        </div>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href="/pro/contractor/service-requests"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to service requests"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>

              <div className="min-w-0 flex-1">
                <h1 className={`truncate text-2xl font-bold ${heading}`}>{title}</h1>
                <p className={`mt-1 text-sm ${textMeta} truncate`}>{addrLine}</p>
              </div>
            </div>

            <span className={`flex-shrink-0 rounded-full border px-3 py-1 text-sm font-medium ${status.bg} ${status.color}`}>
              {status.label}
            </span>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Description</h2>
              <p className="whitespace-pre-wrap text-white/90">{serviceRequest.description}</p>
            </section>

            {/* Photos */}
            {signedPhotos.length > 0 && (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Photos ({signedPhotos.length})</h2>
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
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Request Details</h2>
              <dl className="space-y-3">
                {serviceRequest.category ? (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Category:</dt>
                    <dd className="text-white">{serviceRequest.category}</dd>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Urgency:</dt>
                  <dd className="text-white">
                    {serviceRequest.urgency}
                    {serviceRequest.urgency === "EMERGENCY" ? " 🚨" : ""}
                  </dd>
                </div>

                {(serviceRequest.budgetMin || serviceRequest.budgetMax) ? (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Budget Range:</dt>
                    <dd className="text-white">
                      ${Number(serviceRequest.budgetMin || 0).toLocaleString()} - ${Number(serviceRequest.budgetMax || 0).toLocaleString()}
                    </dd>
                  </div>
                ) : null}

                {serviceRequest.desiredDate ? (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Preferred Date:</dt>
                    <dd className="text-white">{format(new Date(serviceRequest.desiredDate), "MMM d, yyyy")}</dd>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <dt className={`w-32 ${textMeta}`}>Requested:</dt>
                  <dd className="text-white">{format(new Date(serviceRequest.createdAt), "MMM d, yyyy 'at' h:mm a")}</dd>
                </div>

                {serviceRequest.respondedAt ? (
                  <div className="flex gap-3">
                    <dt className={`w-32 ${textMeta}`}>Responded:</dt>
                    <dd className="text-white">{format(new Date(serviceRequest.respondedAt), "MMM d, yyyy 'at' h:mm a")}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {/* Your Notes */}
            {serviceRequest.contractorNotes ? (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Your Notes</h2>
                <p className="whitespace-pre-wrap text-white/90">{serviceRequest.contractorNotes}</p>
              </section>
            ) : null}

            {/* Your Quote */}
            {serviceRequest.quote ? (
              <section className={glass}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className={`text-lg font-semibold ${heading}`}>Your Quote</h2>
                  <span className="text-2xl font-bold text-white">${Number(serviceRequest.quote.totalAmount).toLocaleString()}</span>
                </div>

                {serviceRequest.quote.description ? <p className={`mb-4 ${textMeta}`}>{serviceRequest.quote.description}</p> : null}

                {serviceRequest.quote.items && serviceRequest.quote.items.length > 0 ? (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-white/80">Line Items:</h3>
                    <div className="overflow-hidden rounded-lg border border-white/10 bg-white/5">
                      {serviceRequest.quote.items.map((item: QuoteItemForDisplay) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-0"
                        >
                          <div className="flex-1">
                            <p className="text-sm text-white">{item.item}</p>
                            <p className={`text-xs ${textMeta}`}>
                              {Number(item.qty)} × ${Number(item.unitPrice).toLocaleString()}
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-white">${Number(item.total).toLocaleString()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {serviceRequest.quote.expiresAt ? (
                  <p className={`mt-4 text-xs ${textMeta}`}>Quote expires: {format(new Date(serviceRequest.quote.expiresAt), "MMM d, yyyy")}</p>
                ) : null}
              </section>
            ) : null}

            {/* Work Record */}
            {serviceRequest.serviceRecord ? (
              <section className={glass}>
                <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Work Completed</h2>
                <Link href={`/pro/contractor/work/${serviceRequest.serviceRecord.id}`} className={`${glassTight} block hover:bg-white/10`}>
                  <p className="font-medium text-white">{serviceRequest.serviceRecord.serviceType}</p>
                  {serviceRequest.serviceRecord.serviceDate ? (
                    <p className={`mt-1 text-sm ${textMeta}`}>
                      Completed: {format(new Date(serviceRequest.serviceRecord.serviceDate), "MMM d, yyyy")}
                    </p>
                  ) : null}
                  {serviceRequest.serviceRecord.cost ? (
                    <p className="mt-2 text-lg font-semibold text-white">
                      ${Number(serviceRequest.serviceRecord.cost).toLocaleString()}
                    </p>
                  ) : null}
                </Link>
              </section>
            ) : null}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Homeowner */}
            <section className={glass}>
              <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Homeowner</h2>
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
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white/10">
                    <span className="text-2xl font-medium">{(serviceRequest.homeowner.name || "H")[0]?.toUpperCase() || "H"}</span>
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{serviceRequest.homeowner.name || "Homeowner"}</p>
                  <p className={`mt-1 text-sm ${textMeta} truncate`}>✉️ {serviceRequest.homeowner.email}</p>
                </div>
              </div>
            </section>

            {/* Actions */}
            <ContractorServiceRequestActions serviceRequest={serviceRequestForActions} />
          </div>
        </div>
      </div>
    </main>
  );
}