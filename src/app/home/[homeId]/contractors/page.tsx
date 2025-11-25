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

type Connection = {
  id: string;
  createdAt: Date;
  totalSpent: { toNumber: () => number } | null;
  lastWorkDate: Date | null;
  contractorId: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
    } | null;
  } | null;
};

type WorkRecord = {
  id: string;
  contractorId: string | null;
};

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

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
      connections: {
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          createdAt: true,
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
                },
              },
            },
          },
        },
      },
      workRecords: {
        where: {
          isVerified: true,
        },
        select: {
          id: true,
          contractorId: true,
        },
      },
    },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  const connections = home.connections as Connection[];
  const workRecords = home.workRecords as WorkRecord[];

  // Count verified work per contractor
  const verifiedWorkByContractor = new Map<string, number>();
  for (const record of workRecords) {
    if (record.contractorId) {
      const count = verifiedWorkByContractor.get(record.contractorId) || 0;
      verifiedWorkByContractor.set(record.contractorId, count + 1);
    }
  }

  // Calculate stats
  const totalContractors = connections.length;
  const totalVerifiedJobs = workRecords.length;
  const totalSpentAmount = connections.reduce((sum, conn) => {
    return sum + (conn.totalSpent ? conn.totalSpent.toNumber() : 0);
  }, 0);
  const activeContractors = connections.filter(conn => conn.lastWorkDate).length;

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
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Your Trusted Pros
                </h1>
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
        {connections.length === 0 ? (
          <section className={glass}>
            <div className="py-12 text-center">
              <div className="text-5xl mb-4">👷</div>
              <h2 className="text-xl font-semibold text-white mb-2">
                No connected contractors yet
              </h2>
              <p className="text-white/60 mb-6 max-w-md mx-auto">
                Connect with pros who&apos;ve worked on your home to build your trusted network and get verified records.
              </p>
              <ContractorActions homeId={homeId} homeAddress={addrLine} showInviteButton />
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            {connections.map((conn) => (
              <ContractorRow
                key={conn.id}
                connection={conn}
                homeId={homeId}
                verifiedWorkCount={verifiedWorkByContractor.get(conn.contractorId) || 0}
              />
            ))}
          </section>
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

function ContractorRow({
  connection,
  homeId,
  verifiedWorkCount,
}: {
  connection: Connection;
  homeId: string;
  verifiedWorkCount: number;
}) {
  const contractor = connection.contractor;
  if (!contractor) return null;

  const displayName = contractor.proProfile?.businessName || contractor.name || contractor.email;
  const initials = (displayName || "C")[0].toUpperCase();
  const totalSpent = connection.totalSpent ? connection.totalSpent.toNumber() : 0;

  return (
    <div className={`${glass}`}>
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 sm:hidden">
        {/* Top row: Avatar + Info */}
        <div className="flex items-start gap-3">
          {contractor.image ? (
            <Image
              src={contractor.image}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white truncate">{displayName}</h3>
            {contractor.proProfile?.businessName && contractor.name && (
              <p className="text-sm text-white/60 truncate">{contractor.name}</p>
            )}
            <p className="text-xs text-white/50 mt-1">
              Connected {formatDate(connection.createdAt)}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-4">
          <div className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
            <div className="text-lg font-semibold text-white">{verifiedWorkCount}</div>
            <div className="text-xs text-white/50">Verified Jobs</div>
          </div>
          {totalSpent > 0 && (
            <div className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
              <div className="text-lg font-semibold text-green-400">${totalSpent.toLocaleString()}</div>
              <div className="text-xs text-white/50">Total Spent</div>
            </div>
          )}
          {connection.lastWorkDate && (
            <div className="flex-1 rounded-lg bg-white/5 px-3 py-2 text-center">
              <div className="text-sm font-semibold text-white">{formatDate(connection.lastWorkDate)}</div>
              <div className="text-xs text-white/50">Last Work</div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Link
            href={`/home/${homeId}/messages/${connection.id}`}
            className="flex-1 px-3 py-2 text-sm text-center rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Message
          </Link>
          <Link
            href={`/home/${homeId}/contractors/${connection.id}`}
            className="flex-1 px-3 py-2 text-sm text-center rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            View →
          </Link>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-4">
        {/* Avatar */}
        {contractor.image ? (
          <Image
            src={contractor.image}
            alt={displayName}
            width={56}
            height={56}
            className="rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-xl flex-shrink-0">
            {initials}
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate">{displayName}</h3>
          {contractor.proProfile?.businessName && contractor.name && (
            <p className="text-sm text-white/60">{contractor.name}</p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-white/50">
            <span>Connected {formatDate(connection.createdAt)}</span>
            {connection.lastWorkDate && (
              <span>Last work {formatDate(connection.lastWorkDate)}</span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 flex-shrink-0">
          <div className="text-center">
            <div className="text-lg font-semibold text-white">
              {verifiedWorkCount}
            </div>
            <div className="text-xs text-white/50">Verified Jobs</div>
          </div>
          {totalSpent > 0 && (
            <div className="text-center">
              <div className="text-lg font-semibold text-green-400">
                ${totalSpent.toLocaleString()}
              </div>
              <div className="text-xs text-white/50">Total Spent</div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-shrink-0">
          <Link
            href={`/home/${homeId}/messages/${connection.id}`}
            className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            Message
          </Link>
          <Link
            href={`/home/${homeId}/contractors/${connection.id}`}
            className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition"
          >
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}