import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ContractorDetailClient } from "./ContractorDetailClient";

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ContractorDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; connectionId: string }>;
}) {
  const { homeId, connectionId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  // Connection with related data
  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      homeId,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      totalSpent: true,
      lastWorkDate: true,
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
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
        },
      },
    },
  });

  if (!connection || !connection.contractor) notFound();

  const contractor = connection.contractor;

  // Work records for this home + contractor
  const workRecords = await prisma.workRecord.findMany({
    where: {
      homeId,
      contractorId: contractor.id,
    },
    orderBy: { workDate: "desc" },
    select: {
      id: true,
      workType: true,
      description: true,
      workDate: true,
      cost: true,
      isVerified: true,
      status: true,
      createdAt: true,
      finalRecordId: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });

  // Job requests between homeowner + contractor
  const jobRequests = await prisma.jobRequest.findMany({
    where: {
      homeId,
      contractorId: contractor.id,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      urgency: true,
      category: true,
      budgetMin: true,
      budgetMax: true,
      desiredDate: true,
      createdAt: true,
      quote: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
        },
      },
      workRecord: {
        select: {
          id: true,
          status: true,
          workDate: true,
        },
      },
    },
  });

  // Pending work submissions from contractor awaiting homeowner review
  const pendingWorkSubmissions = await prisma.workSubmission.findMany({
    where: {
      homeId,
      contractorId: contractor.id,
      status: "PENDING_REVIEW",
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      workType: true,
      description: true,
      workDate: true,
      createdAt: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });

  const home = connection.home;
  const addrLine = `${home.address}${
    home.city ? `, ${home.city}` : ""
  }${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  // Stats - calculate totalSpent from verified work records
  const verifiedRecords = workRecords.filter((r) => r.isVerified);
  const verifiedJobsCount = verifiedRecords.length;
  const totalJobsCount = workRecords.length;
  const totalSpent = verifiedRecords.reduce(
    (sum, r) => sum + (r.cost ? Number(r.cost) : 0),
    0
  );

  const activeRequestsCount = jobRequests.filter((r) =>
    ["PENDING", "QUOTED", "ACCEPTED", "IN_PROGRESS"].includes(r.status)
  ).length;

  // Display data
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
    lastWorkDate: connection.lastWorkDate?.toISOString() || null,
  };

  const workRecordsData = workRecords.map((record) => ({
    id: record.id,
    workType: record.workType,
    description: record.description,
    workDate: record.workDate.toISOString(),
    cost: record.cost ? Number(record.cost) : null,
    isVerified: record.isVerified,
    status: record.status,
    createdAt: record.createdAt.toISOString(),
    attachmentCount: record.attachments.length,
    hasImages: record.attachments.some((a) =>
      a.mimeType?.startsWith("image/")
    ),
    finalRecordId: record.finalRecordId,
  }));

  const jobRequestsData = jobRequests.map((req) => ({
    id: req.id,
    title: req.title,
    description: req.description,
    status: req.status,
    urgency: req.urgency,
    category: req.category,
    budgetMin: req.budgetMin ? Number(req.budgetMin) : null,
    budgetMax: req.budgetMax ? Number(req.budgetMax) : null,
    desiredDate: req.desiredDate?.toISOString() || null,
    createdAt: req.createdAt.toISOString(),
    quote: req.quote
      ? {
          id: req.quote.id,
          totalAmount: Number(req.quote.totalAmount),
          status: req.quote.status,
        }
      : null,
    workRecord: req.workRecord
      ? {
          id: req.workRecord.id,
          status: req.workRecord.status,
          workDate: req.workRecord.workDate.toISOString(),
        }
      : null,
  }));

  // ---- Pending submissions: workSubmissions + documented_pending workRecords ----

  const pendingFromSubmissions = pendingWorkSubmissions.map((sub) => ({
    id: sub.id,
    workType: sub.workType,
    description: sub.description,
    workDate: sub.workDate.toISOString(),
    createdAt: sub.createdAt.toISOString(),
    attachmentCount: sub.attachments.length,
    hasImages: sub.attachments.some((a) =>
      a.mimeType?.startsWith("image/")
    ),
  }));

  // Treat documented_pending / documented_unverified work records as pending submissions too
  const pendingFromRecords = workRecordsData
    .filter((r) =>
      ["DOCUMENTED_UNVERIFIED"].includes(r.status)
    )
    .map((r) => ({
      id: r.id,
      workType: r.workType,
      description: r.description,
      workDate: r.workDate,
      createdAt: r.createdAt,
      attachmentCount: r.attachmentCount,
      hasImages: r.hasImages,
    }));

  const pendingSubmissionsData = [
    ...pendingFromSubmissions,
    ...pendingFromRecords,
  ];

  const pendingSubmissionsCount = pendingSubmissionsData.length;

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
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Contractors", href: `/home/${homeId}/contractors` },
            { label: contractorData.businessName || contractorData.name || "Contractor" },
          ]}
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 min-w-0 items-center gap-4">
              <Link
                href={`/home/${homeId}/contractors`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to contractors"
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

              {/* Avatar */}
              {contractorData.image ? (
                <Image
                  src={contractorData.image}
                  alt={
                    contractorData.businessName ||
                    contractorData.name ||
                    "Contractor"
                  }
                  width={64}
                  height={64}
                  className="h-16 w-16 flex-shrink-0 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-2xl font-bold text-orange-400">
                  {(
                    contractorData.businessName ||
                    contractorData.name ||
                    "C"
                  )[0].toUpperCase()}
                </div>
              )}

              {/* Name + meta */}
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className={`truncate text-2xl font-bold ${heading}`}>
                    {contractorData.businessName ||
                      contractorData.name ||
                      contractorData.email}
                  </h1>
                  {contractorData.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                      <svg
                        className="h-3 w-3"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified
                    </span>
                  )}
                  {contractorData.rating && (
                    <span className="text-sm text-yellow-400">
                      ⭐ {contractorData.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                {contractorData.businessName && contractorData.name && (
                  <p className={`text-sm ${textMeta}`}>
                    {contractorData.name}
                    {contractorData.company && ` • ${contractorData.company}`}
                  </p>
                )}

                {/* Phone + email inline */}
                <div className="flex flex-wrap items-center gap-3 text-sm">
                  {contractorData.phone && (
                    <a
                      href={`tel:${contractorData.phone}`}
                      className="text-white/80 hover:text-white"
                    >
                      {contractorData.phone}
                    </a>
                  )}
                  {contractorData.email && (
                    <a
                      href={`mailto:${contractorData.email}`}
                      className="text-white/60 hover:text-white/90"
                    >
                      {contractorData.email}
                    </a>
                  )}
                  {contractorData.website && (
                    <a
                      href={contractorData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/60 hover:text-white/90 underline-offset-2 hover:underline"
                    >
                      Website
                    </a>
                  )}
                </div>

                <p className={`text-xs ${textMeta}`}>
                  Connected {formatDate(connectionData.createdAt)}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-shrink-0 gap-2">
              <Link
                href={`/home/${homeId}/messages/${connectionData.id}`}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/20"
              >
                💬 Message
              </Link>
              <Link
                href={`/home/${homeId}/job-requests/new?contractor=${contractorData.id}`}
                className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600"
              >
                + Request Work
              </Link>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total Jobs" value={totalJobsCount} />
          <StatCard label="Verified Jobs" value={verifiedJobsCount} />
          <StatCard
            label="Total Spent"
            value={
              totalSpent > 0 ? `$${totalSpent.toLocaleString()}` : "$0"
            }
            highlight={totalSpent > 0 ? "green" : undefined}
          />
          <StatCard
            label="Pending Submissions"
            value={pendingSubmissionsCount}
            highlight={pendingSubmissionsCount > 0 ? "orange" : undefined}
          />
        </section>

        {/* Tabs: work history / requests / pending submissions */}
        <ContractorDetailClient
          homeId={homeId}
          connectionId={connectionData.id}
          workRecords={workRecordsData}
          jobRequests={jobRequestsData}
          pendingSubmissions={pendingSubmissionsData}
          activeRequestsCount={activeRequestsCount}
        />

        <div className="h-12" />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: "green" | "orange";
}) {
  return (
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold ${
          highlight === "green"
            ? "text-green-400"
            : highlight === "orange"
            ? "text-orange-400"
            : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}