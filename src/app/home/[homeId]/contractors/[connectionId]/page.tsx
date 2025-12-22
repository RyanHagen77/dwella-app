import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, textMeta, heading } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ContractorDetailTabs } from "./_components/ContractorDetailTabs";
import { DisconnectContractor } from "./DisconnectContractor";

type PageProps = {
  params: { homeId: string; connectionId: string };
  searchParams: { tab?: string };
};

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ✅ helper: normalize Prisma BigInt -> number for client props
function toNumber(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export default async function ContractorDetailPage({ params, searchParams }: PageProps) {
  const { homeId, connectionId } = params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  const connection = await prisma.connection.findFirst({
    where: { id: connectionId, homeId },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      totalSpent: true,
      lastServiceDate: true,
      contractorId: true,
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
              website: true,
              bio: true,
              verified: true,
              rating: true,
            },
          },
        },
      },
      home: { select: { id: true, address: true, city: true, state: true, zip: true } },
    },
  });

  if (!connection || !connection.contractor) notFound();

  const contractor = connection.contractor;

  const serviceRecords = await prisma.serviceRecord.findMany({
    where: { homeId, contractorId: contractor.id },
    orderBy: { serviceDate: "desc" },
    select: {
      id: true,
      serviceType: true,
      description: true,
      serviceDate: true,
      cost: true,
      isVerified: true,
      status: true,
      createdAt: true,
      finalRecordId: true,
      attachments: { select: { id: true, filename: true, mimeType: true, size: true } },
    },
  });

  // ✅ match CompletedServiceSubmissionsClient request shape (includes contractor + updatedAt)
  const serviceRequests = await prisma.serviceRequest.findMany({
    where: { homeId, contractorId: contractor.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      urgency: true,
      budgetMin: true,
      budgetMax: true,
      desiredDate: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      respondedAt: true,
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
            },
          },
        },
      },
      quote: { select: { id: true, totalAmount: true, status: true, expiresAt: true } },
      serviceRecord: { select: { id: true, status: true, serviceDate: true } },
    },
  });

  // Pending submissions (ServiceSubmission). Keep your existing select.
  const pendingServiceSubmissions = await prisma.serviceSubmission.findMany({
    where: { homeId, contractorId: contractor.id, status: "PENDING_REVIEW" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      serviceType: true,
      description: true,
      serviceDate: true,
      createdAt: true,
      attachments: { select: { id: true, filename: true, mimeType: true, size: true } },
    },
  });

  const home = connection.home;
  const addrLine =
    `${home.address}` +
    `${home.city ? `, ${home.city}` : ""}` +
    `${home.state ? `, ${home.state}` : ""}` +
    `${home.zip ? ` ${home.zip}` : ""}`;

  const verifiedRecords = serviceRecords.filter((r) => r.isVerified);
  const verifiedServicesCount = verifiedRecords.length;
  const totalServicesCount = serviceRecords.length;

  const totalSpent = verifiedRecords.reduce((sum, r) => sum + (r.cost ? Number(r.cost) : 0), 0);

  const activeRequestsCount = serviceRequests.filter((r) =>
    ["PENDING", "QUOTED", "ACCEPTED", "IN_PROGRESS"].includes(r.status)
  ).length;

  const contractorData = {
    id: contractor.id,
    name: contractor.name,
    email: contractor.email,
    image: contractor.image,
    businessName: contractor.proProfile?.businessName || null,
    company: contractor.proProfile?.company || null,
    phone: contractor.proProfile?.phone || null,
    website: contractor.proProfile?.website || null,
    bio: contractor.proProfile?.bio || null,
    verified: contractor.proProfile?.verified || false,
    rating: contractor.proProfile?.rating || null,
  };

  const connectionData = {
    id: connection.id,
    status: connection.status,
    createdAt: connection.createdAt.toISOString(),
    updatedAt: connection.updatedAt.toISOString(),
    totalSpent,
    lastServiceDate: connection.lastServiceDate?.toISOString() || null,
  };

  // ✅ This is the “new request” href your tabs page expects
  const requestHref = `/home/${homeId}/service-requests/new?contractor=${contractorData.id}`;

  // ✅ ServiceRequestsClient shape
  const serviceRequestsData = serviceRequests.map((req) => ({
    id: req.id,
    title: req.title,
    description: req.description,
    category: req.category,
    urgency: req.urgency,
    budgetMin: req.budgetMin ? Number(req.budgetMin) : null,
    budgetMax: req.budgetMax ? Number(req.budgetMax) : null,
    desiredDate: req.desiredDate?.toISOString() || null,
    status: req.status,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    respondedAt: req.respondedAt?.toISOString() || null,
    contractor: {
      id: req.contractor.id,
      name: req.contractor.name,
      email: req.contractor.email,
      image: req.contractor.image,
      proProfile: req.contractor.proProfile
        ? {
            businessName: req.contractor.proProfile.businessName,
            company: req.contractor.proProfile.company,
            phone: req.contractor.proProfile.phone,
            verified: req.contractor.proProfile.verified,
            rating: req.contractor.proProfile.rating,
          }
        : null,
    },
    quote: req.quote
      ? {
          id: req.quote.id,
          totalAmount: Number(req.quote.totalAmount),
          status: req.quote.status,
          expiresAt: req.quote.expiresAt?.toISOString() || null,
        }
      : null,
    serviceRecord: req.serviceRecord
      ? {
          id: req.serviceRecord.id,
          status: req.serviceRecord.status,
          serviceDate: req.serviceRecord.serviceDate.toISOString(),
        }
      : null,
  }));

  // ✅ normalize attachments with size:number
  const mapAttachments = (
    list: { id: string; filename: string; mimeType: string | null; size: unknown }[]
  ) =>
    list.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      size: toNumber(a.size), // ✅ bigint -> number
      url: null as string | null,
    }));

  // ✅ PendingService shape EXACTLY like your working page
  const pendingFromSubmissions = pendingServiceSubmissions.map((sub) => ({
    id: sub.id,
    title: sub.serviceType, // submission doesn’t have title; match placement
    description: sub.description,
    serviceDate: sub.serviceDate.toISOString(),
    cost: null,
    contractor: {
      id: contractorData.id,
      name: contractorData.name,
      email: contractorData.email,
      image: contractorData.image,
      proProfile: {
        businessName: contractorData.businessName,
        company: contractorData.company,
      },
    },
    createdAt: sub.createdAt.toISOString(),
    attachments: mapAttachments(sub.attachments),
  }));

  // ✅ PendingService from records: include attachments (and cost)
  const pendingFromRecords = serviceRecords
    .filter((r) => r.status === "DOCUMENTED_UNVERIFIED")
    .map((r) => ({
      id: r.id,
      title: r.serviceType,
      description: r.description,
      serviceDate: r.serviceDate.toISOString(),
      cost: r.cost ? Number(r.cost) : null,
      contractor: {
        id: contractorData.id,
        name: contractorData.name,
        email: contractorData.email,
        image: contractorData.image,
        proProfile: {
          businessName: contractorData.businessName,
          company: contractorData.company,
        },
      },
      createdAt: r.createdAt.toISOString(),
      attachments: mapAttachments(r.attachments),
    }));

  const pendingService = [...pendingFromSubmissions, ...pendingFromRecords];
  const pendingSubmissionsCount = pendingService.length;

  const tab = searchParams.tab;
  const activeTab = tab === "pending" ? "submissions" : "requests";

  const contractorLabel =
    contractorData.businessName || contractorData.name || contractorData.email || "Contractor";

  return (
    <main className="relative min-h-screen text-white">
      {/* Background */}
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

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Contractors", href: `/home/${homeId}/contractors` },
            { label: contractorLabel },
          ]}
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <Link
                  href={`/home/${homeId}/contractors`}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                  aria-label="Back to contractors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
                  </svg>
                </Link>

                {contractorData.image ? (
                  <Image
                    src={contractorData.image}
                    alt={contractorLabel}
                    width={64}
                    height={64}
                    className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-2xl font-bold text-orange-400">
                    {(contractorLabel[0] || "C").toUpperCase()}
                  </div>
                )}

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={`truncate text-2xl font-bold ${heading}`}>{contractorLabel}</h1>

                    {contractorData.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    ) : null}

                    {contractorData.rating ? (
                      <span className="text-sm text-yellow-400">⭐ {contractorData.rating.toFixed(1)}</span>
                    ) : null}
                  </div>

                  {contractorData.businessName && contractorData.name ? (
                    <p className={`text-sm ${textMeta}`}>
                      {contractorData.name}
                      {contractorData.company ? ` • ${contractorData.company}` : ""}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    {contractorData.phone ? (
                      <a href={`tel:${contractorData.phone}`} className="text-white/80 hover:text-white">
                        {contractorData.phone}
                      </a>
                    ) : null}

                    {contractorData.email ? (
                      <a href={`mailto:${contractorData.email}`} className="text-white/60 hover:text-white/90">
                        {contractorData.email}
                      </a>
                    ) : null}

                    {contractorData.website ? (
                      <a
                        href={contractorData.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/60 underline-offset-2 hover:text-white/90 hover:underline"
                      >
                        Website
                      </a>
                    ) : null}
                  </div>

                  <p className={`text-xs ${textMeta}`}>
                    Connected {formatDate(connectionData.createdAt)} • {activeRequestsCount} active request
                    {activeRequestsCount === 1 ? "" : "s"} • {pendingSubmissionsCount} pending submission
                    {pendingSubmissionsCount === 1 ? "" : "s"} • {verifiedServicesCount}/{totalServicesCount} verified •{" "}
                    {totalSpent > 0 ? `$${totalSpent.toLocaleString()} spent` : "$0 spent"}
                  </p>
                </div>
              </div>
            </div>

            {/* Only Message button remains */}
            <div className="flex flex-shrink-0 justify-end">
              <Link
                href={`/home/${homeId}/messages/${connectionData.id}`}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
              >
                💬 Message
              </Link>
            </div>
          </div>
        </section>

        <ContractorDetailTabs
          homeId={homeId}
          pendingService={pendingService}
          serviceRequests={serviceRequestsData}
          requestHref={requestHref}
          activeTab={activeTab}
        />

        <DisconnectContractor
          connectionId={connectionData.id}
          homeId={homeId}
          contractorName={contractorData.businessName || contractorData.name || "this contractor"}
        />

        <div className="h-12" />
      </div>
    </main>
  );
}