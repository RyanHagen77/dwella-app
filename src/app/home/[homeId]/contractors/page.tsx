import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, textMeta, heading } from "@/lib/glass";
import { ContractorActions } from "./ContractorActions";

type Connection = {
  id: string;
  createdAt: Date;
  verifiedWorkCount: number;
  totalSpent: { toNumber: () => number } | null;
  lastWorkDate: Date | null;
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
          verifiedWorkCount: true,
          totalSpent: true,
          lastWorkDate: true,
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
    },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  const connections = home.connections as Connection[];

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
      </div>

      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link
              href={`/home/${homeId}`}
              className="text-sm text-white/60 hover:text-white transition"
            >
              ← Back to Home
            </Link>
            <h1 className={`text-2xl font-bold mt-2 ${heading}`}>
              Your Trusted Pros
            </h1>
            <p className={`text-sm ${textMeta}`}>{addrLine}</p>
          </div>
          <ContractorActions homeId={homeId} homeAddress={addrLine} />
        </div>

        {/* Contractors List */}
        {connections.length === 0 ? (
          <div className={`${glass} py-12 text-center`}>
            <div className="text-5xl mb-4">👷</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No connected contractors yet
            </h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Connect with pros who&apos;ve worked on your home to build your trusted network and get verified records.
            </p>
            <ContractorActions homeId={homeId} homeAddress={addrLine} showInviteButton />
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((conn) => (
              <ContractorRow
                key={conn.id}
                connection={conn}
                homeId={homeId}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function ContractorRow({
  connection,
  homeId,
}: {
  connection: Connection;
  homeId: string;
}) {
  const contractor = connection.contractor;
  if (!contractor) return null;

  const displayName = contractor.proProfile?.businessName || contractor.name || contractor.email;
  const initials = (displayName || "C")[0].toUpperCase();
  const totalSpent = connection.totalSpent ? connection.totalSpent.toNumber() : 0;

  return (
    <div className={`${glass} flex items-center gap-4`}>
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
            {connection.verifiedWorkCount}
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
          href={`/home/${homeId}/messages?contractor=${contractor.id}`}
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
  );
}