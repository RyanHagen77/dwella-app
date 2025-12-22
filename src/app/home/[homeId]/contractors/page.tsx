// app/home/[homeId]/contractors/page.tsx
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";
import { ContractorActions } from "./ContractorActions";
import { ContractorsListClient } from "./ContractorsListClient";

export const dynamic = "force-dynamic";

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
    select: { id: true, address: true, city: true, state: true, zip: true },
  });
  if (!home) notFound();

  const addrLine =
    `${home.address}` +
    `${home.city ? `, ${home.city}` : ""}` +
    `${home.state ? `, ${home.state}` : ""}` +
    `${home.zip ? ` ${home.zip}` : ""}`;

  // Active connections
  const activeConnectionsRaw = await prisma.connection.findMany({
    where: { homeId, status: "ACTIVE", contractorId: { not: null } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      archivedAt: true,
      lastServiceDate: true,
      contractorId: true,
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: { select: { businessName: true } },
        },
      },
    },
  });

  // Archived connections
  const archivedConnectionsRaw = await prisma.connection.findMany({
    where: { homeId, status: "ARCHIVED", contractorId: { not: null } },
    orderBy: { archivedAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      archivedAt: true,
      lastServiceDate: true,
      contractorId: true,
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: { select: { businessName: true } },
        },
      },
    },
  });

  // Verified work for stats
  const serviceRecords = await prisma.serviceRecord.findMany({
    where: { homeId, isVerified: true },
    select: { contractorId: true, cost: true },
  });

  const verifiedServiceByContractor = new Map<string, number>();
  const spentByContractor = new Map<string, number>();

  for (const record of serviceRecords) {
    if (!record.contractorId) continue;

    verifiedServiceByContractor.set(
      record.contractorId,
      (verifiedServiceByContractor.get(record.contractorId) || 0) + 1
    );

    const cost = record.cost ? Number(record.cost) : 0;
    spentByContractor.set(
      record.contractorId,
      (spentByContractor.get(record.contractorId) || 0) + cost
    );
  }

  type ConnRow = (typeof activeConnectionsRaw)[number];

  const mapConnection = (conn: ConnRow) => ({
    id: conn.id,
    createdAt: conn.createdAt.toISOString(),
    archivedAt: conn.archivedAt?.toISOString() || null,
    lastServiceDate: conn.lastServiceDate?.toISOString() || null,
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
    verifiedServiceCount: verifiedServiceByContractor.get(conn.contractorId || "") || 0,
    totalSpent: spentByContractor.get(conn.contractorId || "") || 0,
  });

  const activeConnections = activeConnectionsRaw.map(mapConnection);
  const archivedConnections = archivedConnectionsRaw.map(mapConnection);

  const totalContractors = activeConnectionsRaw.length;
  const totalVerifiedServices = serviceRecords.length;
  const totalSpentAmount = Array.from(spentByContractor.values()).reduce((sum, n) => sum + n, 0);
  const activeContractors = activeConnectionsRaw.length;

  const breadcrumbItems = [
    { label: addrLine || "Home", href: `/home/${homeId}` },
    { label: "Contractors" },
  ];

  const hasAny = activeConnections.length > 0 || archivedConnections.length > 0;

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Your Trusted Pros"
          meta={
            <span className={textMeta}>
              {totalContractors} {totalContractors === 1 ? "contractor" : "contractors"} •{" "}
              {totalVerifiedServices} verified {totalVerifiedServices === 1 ? "job" : "jobs"}
            </span>
          }
          rightDesktop={<ContractorActions homeId={homeId} homeAddress={addrLine} />}
        />

        {/* Stats (compact; avoids giant tiles) */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Total Contractors" value={totalContractors} />
          <StatCard label="Verified Jobs" value={totalVerifiedServices} />
          <StatCard
            label="Total Spent"
            value={totalSpentAmount > 0 ? `$${totalSpentAmount.toLocaleString()}` : "$0"}
            highlight={totalSpentAmount > 0 ? "green" : undefined}
          />
          <StatCard label="Active Pros" value={activeContractors} />
        </section>

        {!hasAny ? (
          <section className="rounded-2xl border border-white/15 bg-black/55 p-8 shadow-2xl backdrop-blur-xl">
            <div className="py-6 text-center">
              <div className="mb-4 text-5xl">👷</div>
              <h2 className="text-xl font-semibold text-white">No connected contractors yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
                Connect with pros who&apos;ve worked on your home to build your trusted network and get verified records.
              </p>

              <div className="mt-6 flex justify-center">
                <ContractorActions homeId={homeId} homeAddress={addrLine} />
              </div>
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
    <div className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</div>
      <div
        className={[
          "mt-1 text-lg font-semibold leading-tight",
          highlight === "green"
            ? "text-emerald-300"
            : highlight === "yellow"
            ? "text-yellow-300"
            : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}