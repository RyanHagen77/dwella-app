import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";

import { textMeta } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ContractorDetailTabs } from "./_components/ContractorDetailTabs";
import { DisconnectContractor } from "./DisconnectContractor";
import { ContractorHeaderDrawer } from "./_components/ContractorHeaderDrawer";

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

  // Spend derived from verified records
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

  const requestHref = `/home/${homeId}/service-requests/new?contractor=${contractorData.id}`;

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

  const mapAttachments = (list: { id: string; filename: string; mimeType: string | null; size: unknown }[]) =>
    list.map((a) => ({
      id: a.id,
      filename: a.filename,
      mimeType: a.mimeType,
      size: toNumber(a.size),
      url: null as string | null,
    }));

  const pendingFromSubmissions = pendingServiceSubmissions.map((sub) => ({
    id: sub.id,
    title: sub.serviceType,
    description: sub.description,
    serviceDate: sub.serviceDate.toISOString(),
    cost: null,
    contractor: {
      id: contractorData.id,
      name: contractorData.name,
      email: contractorData.email,
      image: contractorData.image,
      proProfile: { businessName: contractorData.businessName, company: contractorData.company },
    },
    createdAt: sub.createdAt.toISOString(),
    attachments: mapAttachments(sub.attachments),
  }));

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
        proProfile: { businessName: contractorData.businessName, company: contractorData.company },
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

  const messageHref = `/home/${homeId}/messages/${connectionData.id}`;

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

        {/* Header: NO window wrapper */}
        <ContractorHeaderDrawer
          title={contractorLabel}
          backHref={`/home/${homeId}/contractors`}
          backLabel="Back to contractors"
          messageHref={messageHref}
          phone={contractorData.phone}   // <-- this must be present
          spendAmount={totalSpent}
          verifiedJobs={verifiedServicesCount}
        >
          {/* Details content (hidden until opened) */}
          <div className="rounded-2xl border border-white/12 bg-black/25 p-5">
            <div className="flex items-start gap-4">
              {contractorData.image ? (
                <Image
                  src={contractorData.image}
                  alt={contractorLabel}
                  width={56}
                  height={56}
                  className="h-14 w-14 flex-shrink-0 rounded-2xl border border-white/10 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-xl font-bold text-white/85">
                  {(contractorLabel[0] || "C").toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {contractorData.verified ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                      Verified
                    </span>
                  ) : null}

                  {contractorData.rating ? (
                    <span className="inline-flex items-center rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-xs font-medium text-white/80">
                      ⭐ {contractorData.rating.toFixed(1)}
                    </span>
                  ) : null}
                </div>

                {contractorData.businessName && contractorData.name ? (
                  <p className={`mt-2 text-sm ${textMeta}`}>
                    {contractorData.name}
                    {contractorData.company ? ` • ${contractorData.company}` : ""}
                  </p>
                ) : contractorData.company ? (
                  <p className={`mt-2 text-sm ${textMeta}`}>{contractorData.company}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  {contractorData.phone ? (
                    <a href={`tel:${contractorData.phone}`} className="text-white/80 hover:text-white">
                      {contractorData.phone}
                    </a>
                  ) : null}

                  <a href={`mailto:${contractorData.email}`} className="text-white/60 hover:text-white/90">
                    {contractorData.email}
                  </a>

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

                {/* Moved here so it doesn’t crowd the header */}
                <p className={`mt-3 text-sm ${textMeta}`}>
                  Connected {formatDate(connectionData.createdAt)} • {activeRequestsCount} active request
                  {activeRequestsCount === 1 ? "" : "s"} • {pendingSubmissionsCount} pending submission
                  {pendingSubmissionsCount === 1 ? "" : "s"} • {verifiedServicesCount}/{totalServicesCount} verified
                </p>
              </div>
            </div>

            {contractorData.bio ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="whitespace-pre-wrap text-sm text-white/80">{contractorData.bio}</p>
              </div>
            ) : null}
          </div>
        </ContractorHeaderDrawer>

        {/* Tabs + content */}
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