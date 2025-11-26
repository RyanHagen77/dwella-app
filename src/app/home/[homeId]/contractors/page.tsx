import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import { ContractorActions } from "./ContractorActions";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { ContractorsListClient } from "./ContractorsListClient";

export default async function ContractorsPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  // Fetch active connections
  const activeConnectionsRaw = await prisma.connection.findMany({
    where: { homeId, status: "ACTIVE", contractorId: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      archivedAt: true,
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
            },
          },
        },
      },
    },
  });

  // Fetch archived connections
  const archivedConnectionsRaw = await prisma.connection.findMany({
    where: { homeId, status: "ARCHIVED", contractorId: { not: null } },
    orderBy: { archivedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      archivedAt: true,
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
            },
          },
        },
      },
    },
  });

  // Fetch verified work records for stats
  const workRecords = await prisma.workRecord.findMany({
    where: { homeId, isVerified: true },
    select: {
      id: true,
      contractorId: true,
      cost: true,
    },
  });

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  // Count verified work per contractor and sum costs
  const verifiedWorkByContractor = new Map<string, number>();
  const spentByContractor = new Map<string, number>();

  for (const record of workRecords) {
    if (record.contractorId) {
      const count = verifiedWorkByContractor.get(record.contractorId) || 0;
      verifiedWorkByContractor.set(record.contractorId, count + 1);

      const cost = record.cost ? Number(record.cost) : 0;
      const currentSpent = spentByContractor.get(record.contractorId) || 0;
      spentByContractor.set(record.contractorId, currentSpent + cost);
    }
  }

  // Transform connections for client component
  const mapConnection = (conn: (typeof activeConnectionsRaw)[number]) => ({
    id: conn.id,
    createdAt: conn.createdAt.toISOString(),
    archivedAt: conn.archivedAt?.toISOString() || null,
    lastWorkDate: conn.lastWorkDate?.toISOString() || null,
    contractorId: conn.contractorId || "",
    contractor: conn.contractor
      ? {
          id: conn.contractor.id,
          name: conn.contractor.name,
          email: conn.contractor.email,
          image: conn.contractor.image,
          businessName: conn.contractor.proProfile?.businessName || null,
        }
      : null,
    verifiedWorkCount: verifiedWorkByContractor.get(conn.contractorId || "") || 0,
    totalSpent: spentByContractor.get(conn.contractorId || "") || 0,
  });

  const activeConnections = activeConnectionsRaw.map(mapConnection);
  const archivedConnections = archivedConnectionsRaw.map(mapConnection);

  // Calculate stats (based on active connections only)
  const totalContractors = activeConnectionsRaw.length;
  const totalVerifiedJobs = workRecords.length;
  const totalSpentAmount = Array.from(spentByContractor.values()).reduce(
    (sum, amount) => sum + amount,
    0
  );
  const activeContractors = activeConnectionsRaw.filter((conn) => conn.lastWorkDate).length;

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

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb href={`/home/${homeId}`} label={addrLine} current="Contractors" />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={`/home/${homeId}`}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to home"
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
                <h1 className={`text-2xl font-bold ${heading}`}>Your Trusted Pros</h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {totalContractors} {totalContractors === 1 ? "contractor" : "contractors"}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <ContractorActions homeId={homeId} homeAddress={addrLine} />
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Contractors" value={totalContractors} />
          <StatCard label="Verified Jobs" value={totalVerifiedJobs} />
          <StatCard
            label="Total Spent"
            value={totalSpentAmount > 0 ? `$${totalSpentAmount.toLocaleString()}` : "$0"}
            highlight={totalSpentAmount > 0 ? "green" : undefined}
          />
          <StatCard label="Active Pros" value={activeContractors} />
        </section>

        {/* Contractors List */}
        {activeConnections.length === 0 && archivedConnections.length === 0 ? (
          <section className={glass}>
            <div className="py-12 text-center">
              <div className="text-5xl mb-4">👷</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No connected contractors yet
              </h2>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Connect with pros who&apos;ve worked on your home to build your trusted network and
                get verified records.
              </p>
              <ContractorActions homeId={homeId} homeAddress={addrLine} />
            </div>
          </section>
        ) : (
          <ContractorsListClient
            homeId={homeId}
            activeConnections={activeConnections}
            archivedConnections={archivedConnections}
          />
        )}

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
  highlight?: "green" | "yellow";
}) {
  return (
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div
        className={`mt-1 text-xl font-semibold ${
          highlight === "green"
            ? "text-green-400"
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