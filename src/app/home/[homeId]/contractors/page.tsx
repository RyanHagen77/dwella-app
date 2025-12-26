// app/home/[homeId]/contractors/page.tsx

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";
import { ContractorsListClient } from "./ContractorsListClient";
import { ContractorActions } from "./ContractorActions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

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
    spentByContractor.set(record.contractorId, (spentByContractor.get(record.contractorId) || 0) + cost);
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
      {/* Background (standard) */}
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

      {/* Standard frame */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Your Trusted Pros"
          meta={
            <span className={textMeta}>
              {totalContractors} {totalContractors === 1 ? "contractor" : "contractors"} • {totalVerifiedServices}{" "}
              verified {totalVerifiedServices === 1 ? "job" : "jobs"} •{" "}
              {totalSpentAmount > 0 ? `$${totalSpentAmount.toLocaleString()} spent` : "$0 spent"}
            </span>
          }
        />

        {!hasAny ? (
          <section className="rounded-2xl border border-white/15 bg-black/55 p-8 shadow-2xl backdrop-blur-xl">
            <div className="py-6 text-center">
              <div className="mb-4 text-5xl">👷</div>
              <h2 className="text-xl font-semibold text-white">No connected contractors yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
                Connect with pros who&apos;ve worked on your home to build your trusted network and get verified records.
              </p>

              <p className="mt-4 text-sm text-white/60">
                Use{" "}
                <span className="inline-block">
                  <ContractorActions homeId={homeId} homeAddress={addrLine} />
                </span>{" "}
                to invite one.
              </p>
            </div>
          </section>
        ) : (
          <ContractorsListClient
            homeId={homeId}
            homeAddress={addrLine}
            activeConnections={activeConnections}
            archivedConnections={archivedConnections}
            stats={{
              totalContractors,
              activeContractors,
              totalVerifiedServices,
              totalSpentAmount,
            }}
          />
        )}

        <div className="h-12" />
      </div>
    </main>
  );
}