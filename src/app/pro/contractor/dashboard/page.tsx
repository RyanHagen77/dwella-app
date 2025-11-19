export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  glass,
  glassTight,
  heading,
  textMeta,
  ctaPrimary,
} from "@/lib/glass";
import { InviteHomeownerButton } from "../../_components/InviteHomeownerButton";
import { UnreadInvitationsBadge } from "@/components/ui/UnreadInvitationsBadge";
import { PendingWorkBadge } from "@/components/ui/PendingWorkBadge";

export default async function ProDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // If pending, redirect to pending page
  if (session.user.proStatus === "PENDING") {
    redirect("/pro/contractor/pending");
  }

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      phone: true,
      licenseNo: true,
      verified: true,
      rating: true,
    },
  });

  const connections = await prisma.connection.findMany({
    where: { contractorId: userId, status: "ACTIVE" },
    include: {
      homeowner: { select: { name: true, email: true } },
      home: { select: { address: true, city: true, state: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // Get work records for recent work section
  const recentWork = await prisma.workRecord.findMany({
    where: {
      contractorId: userId,
    },
    include: {
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
    },
    take: 5,
    orderBy: { workDate: "desc" },
  });

  const totalVerified = await prisma.workRecord.count({
    where: {
      contractorId: userId,
      isVerified: true,
    },
  });

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header with Business Name & Rating */}
        <section className={glass}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className={`text-2xl font-semibold ${heading}`}>
                {proProfile?.businessName || "Pro Dashboard"}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <p className={textMeta}>
                  {proProfile?.type === "CONTRACTOR"
                    ? "Contractor"
                    : proProfile?.type === "REALTOR"
                    ? "Realtor"
                    : proProfile?.type === "INSPECTOR"
                    ? "Inspector"
                    : "Professional"}
                </p>
                {proProfile?.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100">
                    ✓ Verified
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {proProfile?.rating ? proProfile.rating.toFixed(1) : "5.0"}
                </span>
                <span className="text-xl text-yellow-400">★</span>
              </div>
              <p className="text-xs text-white/60">
                {proProfile?.rating ? "Avg Rating" : "Starting Rating"}
              </p>
            </div>
          </div>
        </section>

        {/* Action Cards - Work Requests & Invitations */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Work Requests Card */}
          <Link
            href="/pro/contractor/work-requests"
            className={`${glass} hover:bg-white/10 transition-colors group`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-semibold ${heading}`}>Work Requests</h2>
                  <PendingWorkBadge />
                </div>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  Jobs submitted by homeowners
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>

          {/* Invitations Card */}
          <Link
            href="/pro/contractor/invitations"
            className={`${glass} hover:bg-white/10 transition-colors group`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-semibold ${heading}`}>Invitations</h2>
                  <UnreadInvitationsBadge />
                </div>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  Received & sent invites
                </p>
              </div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Recent Work */}
          <div className="space-y-6 lg:col-span-2">
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${heading}`}>Recent Work</h2>
                <Link
                  href="/pro/contractor/work-records"
                  className="text-sm text-white/70 hover:text-white"
                >
                  View All
                </Link>
              </div>

              {recentWork.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                  <p className="text-white/80 mb-2">
                    Your documented work will appear here.
                  </p>
                  <p className={`mb-4 text-sm ${textMeta}`}>
                    Capture installs, repairs, and inspections so homeowners can keep a
                    verified history of your work.
                  </p>
                  <Link
                    href="/pro/contractor/work-records/new"
                    className={`${ctaPrimary} inline-block px-4 py-2 text-sm`}
                  >
                    + Document Your First Job
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentWork.map((work) => (
                    <Link
                      key={work.id}
                      href={`/pro/contractor/work-records/${work.id}`}
                      className={`${glassTight} block hover:bg-white/10 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {work.workType}
                          </p>
                          <p className={`text-sm ${textMeta} truncate`}>
                            {work.home?.address}
                            {work.home?.city ? `, ${work.home.city}` : ""}
                          </p>
                          <p className={`text-xs ${textMeta}`}>
                            {new Date(work.workDate).toLocaleDateString()}
                            {work.cost && (
                              <span className="ml-2">
                                • ${Number(work.cost).toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                        <StatusBadge status={work.status} />
                      </div>
                    </Link>
                  ))}
                  <div className="pt-2">
                    <Link
                      href="/pro/contractor/work-records/new"
                      className={`${ctaPrimary} block w-full text-center px-4 py-3 text-sm`}
                    >
                      + Document More Work
                    </Link>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Properties */}
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={`text-xl font-semibold ${heading}`}>Properties</h2>
                <Link
                  href="/pro/contractor/properties"
                  className="text-sm text-white/70 hover:text-white"
                >
                  View All
                </Link>
              </div>

              {connections.length === 0 ? (
                <div className="py-8 text-center">
                  <p className={`mb-2 ${textMeta}`}>No properties yet</p>
                  <p className={`mb-4 text-sm ${textMeta}`}>
                    Invite homeowners you've worked with to connect their home.
                  </p>
                  <InviteHomeownerButton className={`${ctaPrimary} w-full px-4 py-2 text-sm`} />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-2xl font-bold text-white">{connections.length}</p>
                    <p className="text-xs text-white/60">Active connections</p>
                  </div>
                  {connections.slice(0, 3).map((conn) => (
                    <div key={conn.id} className={glassTight}>
                      <p className="font-medium text-white text-sm">
                        {conn.homeowner?.name || conn.homeowner?.email || "Homeowner"}
                      </p>
                      <p className={`text-xs ${textMeta} truncate`}>
                        {conn.home?.address}
                        {conn.home?.city ? `, ${conn.home.city}` : ""}
                      </p>
                    </div>
                  ))}
                  {connections.length > 3 && (
                    <p className="text-center text-xs text-white/60 pt-2">
                      +{connections.length - 3} more
                    </p>
                  )}
                  <div className="pt-2 text-center">
                    <InviteHomeownerButton
                      variant="link"
                      className="text-xs text-white/70 hover:text-white"
                    />
                  </div>
                </div>
              )}
            </section>

            {/* Work Records Summary */}
            <section className={glass}>
              <div className="mb-4">
                <h2 className={`text-xl font-semibold ${heading}`}>Work Stats</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${textMeta}`}>Total Documented</p>
                  <p className="text-2xl font-bold text-white">{recentWork.length}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-sm ${textMeta}`}>Verified Work</p>
                  <p className="text-2xl font-bold text-emerald-400">{totalVerified}</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    DOCUMENTED_UNVERIFIED: {
      label: "Pending",
      color: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
    },
    VERIFIED: {
      label: "Verified",
      color: "bg-green-400/10 text-green-300 border-green-400/30",
    },
    DISPUTED: {
      label: "Disputed",
      color: "bg-red-400/10 text-red-300 border-red-400/30",
    },
  };

  const { label, color } = config[status] || {
    label: status,
    color: "bg-gray-400/10 text-gray-300 border-gray-400/30",
  };

  return (
    <span className={`flex-shrink-0 rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {label}
    </span>
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