/**
 * HOME DASHBOARD - REDESIGNED
 *
 * - Hero with home photo + address + verification badge
 * - Property stats
 * - Needs Attention (pending work / requests / invitations / messages / reminders / warranties)
 * - Connected pros
 * - Recent maintenance, reminders, warranties
 */

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, textMeta, ctaPrimary, heading } from "@/lib/glass";
import { HomeActions } from "@/app/home/_components/HomeActions";
import { ClientCard } from "@/app/home/_components/ClientCard";
import { HomePicker } from "@/app/home/_components/HomePicker";
import { PropertyStats } from "@/app/home/_components/PropertyStats";
import { ConnectedPros } from "@/app/home/_components/ConnectedPros";
import { HomeVerificationBadge } from "@/components/home/HomeVerificationBadge";
import { UnreadMessagesAlert } from "@/app/home/_components/UnreadMessagesAlert";
import type { HomeVerificationStatus } from "@prisma/client";

type HomeMeta = {
  attrs?: {
    yearBuilt?: number;
    sqft?: number;
    beds?: number;
    baths?: number;
    estValue?: number;
    healthScore?: number;
    lastUpdated?: string;
  };
};

type HomeRecord = {
  id: string;
  title: string;
  note: string | null;
  kind: string | null;
  date: Date | null;
  vendor: string | null;
  cost: number | null;
};

type Reminder = {
  id: string;
  title: string;
  dueAt: Date;
};

type Warranty = {
  id: string;
  item: string;
  provider: string | null;
  expiresAt: Date | null;
};

type ConnectionWithContractor = {
  id: string;
  createdAt: Date;
  verifiedWorkCount: number;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
    } | null;
  };
};

function formatDate(
  value: Date | string | null | undefined,
  fallback: string = "—"
): string {
  if (!value) return fallback;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString();
}

function isWarrantyExpiringSoon(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return false;
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  return expiresAt >= now && expiresAt <= in90Days;
}

export default async function HomePage({
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
      photos: true,
      meta: true,

      verificationStatus: true,
      verificationMethod: true,
      verifiedAt: true,
      verifiedByUserId: true,

      records: {
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          note: true,
          kind: true,
          date: true,
          vendor: true,
          cost: true,
        },
      },

      // 🔹 Only active reminders (archived/deleted excluded)
      reminders: {
        where: {
          archivedAt: null,
          deletedAt: null,
        },
        orderBy: { dueAt: "asc" },
        take: 10,
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
      },

      warranties: {
        orderBy: { expiresAt: "asc" },
        take: 5,
        select: {
          id: true,
          item: true,
          provider: true,
          expiresAt: true,
        },
      },
      connections: {
        where: { status: "ACTIVE" },
        orderBy: { updatedAt: "desc" },
        take: 4,
        select: {
          id: true,
          createdAt: true,
          verifiedWorkCount: true,
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

  const pendingWorkSubmissionsCount = await prisma.workRecord.count({
    where: {
      homeId,
      isVerified: false,
      status: {
        in: [
          "PENDING_REVIEW",
          "DOCUMENTED_UNVERIFIED",
          "DOCUMENTED",
          "DISPUTED",
        ],
      },
      archivedAt: null,
    },
  });

  const pendingServiceRequestsCount = await prisma.serviceRequest.count({
    where: {
      homeId,
      status: { in: ["PENDING", "QUOTED"] },
    },
  });

  const pendingInvitationsCount = await prisma.invitation.count({
    where: {
      homeId,
      status: "PENDING",
    },
  });

  const addrLine = `${home.address}${
    home.city ? `, ${home.city}` : ""
  }${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  const rawMeta = home.meta as unknown;
  const meta: HomeMeta | null =
    rawMeta && typeof rawMeta === "object" ? (rawMeta as HomeMeta) : null;
  const attrs = meta?.attrs ?? {};

  const stats = {
    yearBuilt: attrs.yearBuilt ?? null,
    sqft: attrs.sqft ?? null,
    beds: attrs.beds ?? null,
    baths: attrs.baths ?? null,
    estValue: attrs.estValue ?? null,
    healthScore: attrs.healthScore ?? null,
    lastUpdated: attrs.lastUpdated ?? undefined,
  };

  const serializedRecords: HomeRecord[] = home.records.map((record) => ({
    ...record,
    cost: record.cost ? Number(record.cost) : null,
  }));

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const reminders = home.reminders as Reminder[];

  const overdueReminders = reminders.filter((r) => {
    const d = new Date(r.dueAt);
    d.setHours(0, 0, 0, 0);
    return d < today;
  });

  const upcomingReminders = reminders.filter((r) => {
    const d = new Date(r.dueAt);
    d.setHours(0, 0, 0, 0);
    return d >= today;
  });

  // "Due soon" == within next 7 days including today
  const dueSoonReminders = upcomingReminders.filter((r) => {
    const d = new Date(r.dueAt);
    d.setHours(0, 0, 0, 0);
    const daysUntil = Math.ceil(
      (d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntil >= 0 && daysUntil <= 7;
  });

  const expiringSoonWarranties = home.warranties.filter((w: Warranty) =>
    isWarrantyExpiringSoon(w.expiresAt, now)
  );

  const connections = home.connections as ConnectionWithContractor[];
  const verificationStatus =
    home.verificationStatus as HomeVerificationStatus | null;

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Hero card */}
        <section
          aria-labelledby="home-hero"
          className={`${glass} overflow-visible relative z-[20]`}
        >
          <h2 id="home-hero" className="sr-only">
            Home overview
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
              {/* Photo */}
              <div className="lg:col-span-2">
                <Image
                  src={home.photos?.[0] ?? "/myhomedox_homeowner1.jpg"}
                  alt={addrLine}
                  width={800}
                  height={450}
                  className="aspect-video w-full rounded-md object-cover"
                />
              </div>

              {/* Right side: picker + address + meta */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <HomePicker
                    currentHomeId={home.id}
                    initialAddress={addrLine}
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className={`text-2xl font-semibold ${heading}`}>
                      {addrLine}
                    </h1>

                    {verificationStatus && (
                      <div className="flex items-center gap-2">
                        <HomeVerificationBadge status={verificationStatus} />
                        {verificationStatus === "UNVERIFIED" && (
                          <Link
                            href={`/home/${home.id}/verify`}
                            className="text-xs text-indigo-300 hover:text-indigo-200"
                          >
                            Verify
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  <p className={`text-sm ${textMeta}`}>
                    Last updated {formatDate(stats.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions row */}
            <HomeActions
              homeId={home.id}
              homeAddress={addrLine}
              unreadMessages={0}
            />
          </div>
        </section>

        {/* Stats */}
        <PropertyStats homeId={home.id} stats={stats} />

        {/* Unified Needs Your Attention (messages + reminders + other) */}
        {(pendingWorkSubmissionsCount > 0 ||
          pendingServiceRequestsCount > 0 ||
          pendingInvitationsCount > 0 ||
          overdueReminders.length > 0 ||
          dueSoonReminders.length > 0 ||
          expiringSoonWarranties.length > 0) && (
          <section className={`${glass} border-l-4 border-orange-400`}>
            <h2
              className={`mb-4 text-lg font-semibold text-orange-400 ${heading}`}
            >
              ⚡ Needs Your Attention
            </h2>

            <div className="space-y-3">
              {/* Unread messages */}
              <UnreadMessagesAlert homeId={home.id} />

              {/* Pending completed work submissions */}
              {pendingWorkSubmissionsCount > 0 && (
                <Link
                  href={`/home/${home.id}/completed-work-submissions`}
                  className="flex items-center justify-between rounded-lg bg.white/5 p-3 transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <p className="text-sm font-medium text.white">
                        Review Completed Work
                      </p>
                      <p className="text-xs text-white/60">
                        {pendingWorkSubmissionsCount} submission
                        {pendingWorkSubmissionsCount !== 1 ? "s" : ""} awaiting
                        approval
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-green-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {pendingWorkSubmissionsCount}
                  </span>
                </Link>
              )}

              {/* Pending service requests */}
              {pendingServiceRequestsCount > 0 && (
                <Link
                  href={`/home/${home.id}/completed-work-submissions`}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔧</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Service Requests
                      </p>
                      <p className="text-xs text-white/60">
                        {pendingServiceRequestsCount} request
                        {pendingServiceRequestsCount !== 1 ? "s" : ""} pending
                        response
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {pendingServiceRequestsCount}
                  </span>
                </Link>
              )}

              {/* Pending invitations */}
              {pendingInvitationsCount > 0 && (
                <Link
                  href={`/home/${home.id}/invitations`}
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg.white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✉️</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Pending Invitations
                      </p>
                      <p className="text-xs text-white/60">
                        {pendingInvitationsCount} invitation
                        {pendingInvitationsCount !== 1 ? "s" : ""} awaiting
                        response
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {pendingInvitationsCount}
                  </span>
                </Link>
              )}

              {/* Overdue reminders */}
              {overdueReminders.length > 0 && (
                <div className="flex items-start justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      ⚠️ Overdue Reminders ({overdueReminders.length})
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                      {overdueReminders.slice(0, 3).map((r) => (
                        <li key={r.id}>
                          • {r.title} (due {formatDate(r.dueAt)})
                        </li>
                      ))}
                      {overdueReminders.length > 3 && (
                        <li>+{overdueReminders.length - 3} more…</li>
                      )}
                    </ul>
                  </div>
                  <Link
                    href={`/home/${home.id}/reminders?status=overdue`}
                    className={`${ctaPrimary} text-xs whitespace-nowrap`}
                  >
                    View All
                  </Link>
                </div>
              )}

              {/* Due soon (next 7 days, incl. today) */}
              {dueSoonReminders.length > 0 && (
                <div className="flex items-start justify-between rounded-lg bg-white/5 p-3 transition hover:bg.white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      ⏰ Upcoming Reminders (next 7 days)
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                      {dueSoonReminders.slice(0, 3).map((r) => (
                        <li key={r.id}>
                          • {r.title} (due {formatDate(r.dueAt)})
                        </li>
                      ))}
                      {dueSoonReminders.length > 3 && (
                        <li>+{dueSoonReminders.length - 3} more…</li>
                      )}
                    </ul>
                  </div>
                  <Link
                    href={`/home/${home.id}/reminders?status=upcoming`}
                    className={`${ctaPrimary} text-xs whitespace-nowrap`}
                  >
                    View All
                  </Link>
                </div>
              )}

              {/* Warranties expiring soon */}
              {expiringSoonWarranties.length > 0 && (
                <div className="flex items-start justify-between rounded-lg bg.white/5 p-3 transition hover:bg.white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      🛡️ Warranties Expiring Soon (
                      {expiringSoonWarranties.length})
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                      {expiringSoonWarranties.slice(0, 3).map((w) => (
                        <li key={w.id}>
                          • {w.item}
                          {w.expiresAt &&
                            ` (expires ${formatDate(w.expiresAt)})`}
                        </li>
                      ))}
                      {expiringSoonWarranties.length > 3 && (
                        <li>+{expiringSoonWarranties.length - 3} more…</li>
                      )}
                    </ul>
                  </div>
                  <Link
                    href={`/home/${home.id}/warranties`}
                    className={`${ctaPrimary} text-xs whitespace-nowrap`}
                  >
                    View All
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            <ConnectedPros
              homeId={home.id}
              homeAddress={addrLine}
              connections={connections}
            />

            {/* Recent Maintenance & Repairs */}
            <ClientCard
              title="Recent Maintenance & Repairs"
              viewAllLink={`/home/${home.id}/records`}
              homeId={home.id}
              addType="record"
            >
              {serializedRecords.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-3">No records yet</p>
                  <p className="mb-4 text-sm text-white/60">
                    Start tracking your home&apos;s maintenance history
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serializedRecords.map((r) => (
                    <RecordItem key={r.id} record={r} homeId={home.id} />
                  ))}
                </div>
              )}
            </ClientCard>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Upcoming Reminders */}
            <ClientCard
              title="Upcoming Reminders"
              viewAllLink={`/home/${home.id}/reminders`}
              homeId={home.id}
              addType="reminder"
            >
              {upcomingReminders.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-2 text-sm">No upcoming reminders</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcomingReminders.map((m) => (
                    <ReminderItem
                      key={m.id}
                      reminder={m}
                      homeId={home.id}
                      now={now}
                    />
                  ))}
                </ul>
              )}
            </ClientCard>

            {/* Active Warranties */}
            <ClientCard
              title="Active Warranties"
              viewAllLink={`/home/${home.id}/warranties`}
              homeId={home.id}
              addType="warranty"
            >
              {home.warranties.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-2 text-sm">No warranties on file</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {home.warranties.map((w) => (
                    <WarrantyItem
                      key={w.id}
                      warranty={w}
                      homeId={home.id}
                      now={now}
                    />
                  ))}
                </ul>
              )}
            </ClientCard>
          </div>
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}

/* ------- Helpers ------- */

function RecordItem({
  record,
  homeId,
}: {
  record: HomeRecord;
  homeId: string;
}) {
  return (
    <Link
      href={`/home/${homeId}/records/${record.id}`}
      className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-white">{record.title}</h3>
            {record.kind && (
              <span className="inline-flex items-center rounded bg-blue-400/20 px-2 py-0.5 text-xs font-medium text-blue-300">
                {record.kind}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
            {record.date && <span>📅 {formatDate(record.date)}</span>}
            {record.vendor && <span>🔧 {record.vendor}</span>}
            {record.cost != null && (
              <span className="font-medium text-green-300">
                ${Number(record.cost).toLocaleString()}
              </span>
            )}
          </div>

          {record.note && (
            <p className="mt-2 line-clamp-2 text-sm text-white/80">
              {record.note}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ReminderItem({
  reminder,
  homeId,
  now,
}: {
  reminder: Reminder;
  homeId: string;
  now: Date;
}) {
  const dueDate = new Date(reminder.dueAt);
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link
      href={`/home/${homeId}/reminders/${reminder.id}`}
      className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white">
            {reminder.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs font-medium ${
              isOverdue ? "text-red-400" : "text-white/70"
            }`}
          >
            {formatDate(dueDate)}
          </span>
          {!isOverdue && daysUntilDue <= 7 && (
            <span className="text-xs text-yellow-400">
              {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function WarrantyItem({
  warranty,
  homeId,
  now,
}: {
  warranty: Warranty;
  homeId: string;
  now: Date;
}) {
  const expiresAt = warranty.expiresAt
    ? new Date(warranty.expiresAt)
    : null;
  const expiringSoon = isWarrantyExpiringSoon(expiresAt, now);

  return (
    <Link
      href={`/home/${homeId}/warranties/${warranty.id}`}
      className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white">
            {warranty.item}
          </h3>
          {warranty.provider && (
            <p className="text-sm text-white/70">
              {warranty.provider}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {expiresAt ? (
            <>
              <span
                className={`text-xs font-medium ${
                  expiringSoon ? "text-yellow-400" : "text-white/70"
                }`}
              >
                {formatDate(expiresAt)}
              </span>
              <span className="text-xs text-white/60">Expires</span>
            </>
          ) : (
            <span className="text-xs text-white/60">No expiry</span>
          )}
        </div>
      </div>
    </Link>
  );
}