"use client";

import Link from "next/link";
import Image from "next/image";
import {
  glass,
  heading,
  textMeta,
  ctaPrimary,
  ctaGhost,
} from "@/lib/glass";
import { InviteHomeownerButton } from "@/app/pro/_components/InviteHomeownerButton";

type ConnectionWithMetrics = {
  id: string;
  homeownerId: string;
  contractorId: string | null;
  realtorId: string | null;
  inspectorId: string | null;
  homeId: string;
  status: string;
  verifiedServiceCount: number;
  totalSpent: number | null;
  lastServiceDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  homeowner: {
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  home: {
    id: string;
    address: string;
    city: string;
    state: string;
    photos: string[];
  } | null;
  daysSinceLastService: number | null;
  notes?: string | null;
  tags: string[];
};

type ServiceRequest = {
  id: string;
  title: string;
  home: {
    owner: {
      name: string | null;
      email: string;
    } | null;
  };
};

type ServiceRecord = {
  id: string;
  serviceType: string;
  serviceDate: Date;
  description: string | null;
  cost: number | null;
  isVerified: boolean;
  home: {
    owner: {
      name: string | null;
      email: string;
    } | null;
  };
};

type ContractorDashboardClientProps = {
  proProfile: {
    businessName: string | null;
    rating: number | null;
  } | null;
  connections: ConnectionWithMetrics[];
  pendingInvitationsCount: number;
  pendingServiceRequestsCount: number;
  pendingServiceRequests: ServiceRequest[];
  pendingServiceCount: number;
  recentService: ServiceRecord[];
  needsFollowUp: ConnectionWithMetrics[];
  contractorRemindersCount: number;
  upcomingReminders: unknown[];
  unreadMessagesCount: number; // 👈 NEW
};

export function ContractorDashboardClient({
  proProfile,
  connections,
  pendingInvitationsCount,
  pendingServiceRequestsCount,
  pendingServiceRequests,
  pendingServiceCount,
  recentService,
  needsFollowUp,
  contractorRemindersCount,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  upcomingReminders,
  unreadMessagesCount, // 👈 NEW
}: ContractorDashboardClientProps) {
  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <section className={glass}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className={`text-2xl font-semibold ${heading}`}>
                {proProfile?.businessName || "Your Business"}
              </h1>
              <p className={textMeta}>
                {connections.length} active client{" "}
                {connections.length === 1 ? "relationship" : "relationships"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-white">
                  {proProfile?.rating ? proProfile.rating.toFixed(1) : "5.0"}
                </span>
                <span className="text-xl text-yellow-400">★</span>
              </div>
              <p className="text-xs text-white/60">Rating</p>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/pro/contractor/service-records/new"
              className={`${ctaPrimary} flex items-center gap-2`}
            >
              + Document Work
            </Link>

            <Link
              href="/pro/messages"
              className={`${ctaGhost} flex items-center gap-2`}
            >
              💬 Messages
              {unreadMessagesCount > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unreadMessagesCount}
                </span>
              )}
            </Link>

            <InviteHomeownerButton
              className={`${ctaGhost} flex items-center gap-2`}
            />

            <button
              type="button"
              disabled
              className={`${ctaGhost} flex items-center gap-2 text-white/40 cursor-not-allowed`}
              title="Coming soon"
            >
              📅 Create Reminder
            </button>
          </div>
        </section>

        {/* Needs Your Attention */}
        {(pendingServiceRequestsCount > 0 ||
          pendingInvitationsCount > 0 ||
          pendingServiceCount > 0 ||
          contractorRemindersCount > 0 ||
          needsFollowUp.length > 0 ||
          unreadMessagesCount > 0) && (
          <section className={`${glass} border-l-4 border-orange-400`}>
            <h2
              className={`mb-4 text-lg font-semibold text-orange-400 ${heading}`}
            >
              ⚡ Needs Your Attention
            </h2>

            <div className="space-y-3">
              {/* Unread Messages */}
              {unreadMessagesCount > 0 && (
                <Link
                  href="/pro/messages"
                  className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">💬</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Unread messages
                      </p>
                      <p className="text-xs text-white/60">
                        You have {unreadMessagesCount} unread message
                        {unreadMessagesCount !== 1 ? "s" : ""}.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-orange-500 px-2.5 py-0.5 text-xs font-bold text-white">
                    {unreadMessagesCount}
                  </span>
                </Link>
              )}

              {/* Pending Service Requests */}
              {pendingServiceRequestsCount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      🔧 Pending Service Requests ({pendingServiceRequestsCount})
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                      {pendingServiceRequests.slice(0, 3).map((req) => (
                        <li key={req.id}>
                          • {req.title} -{" "}
                          {req.home.owner?.name || req.home.owner?.email}
                        </li>
                      ))}
                      {pendingServiceRequestsCount > 3 && (
                        <li>+{pendingServiceRequestsCount - 3} more…</li>
                      )}
                    </ul>
                  </div>
                  <Link
                    href="/pro/contractor/service-requests"
                    className="text-sm text-indigo-300 hover:text-indigo-200 whitespace-nowrap"
                  >
                    View All
                  </Link>
                </div>
              )}

              {/* Pending Invitations */}
              {pendingInvitationsCount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      ✉️ Pending Invitations ({pendingInvitationsCount})
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      {pendingInvitationsCount} homeowner
                      {pendingInvitationsCount !== 1 ? "s" : ""} haven&apos;t
                      accepted yet
                    </p>
                  </div>
                  <Link
                    href="/pro/contractor/invitations"
                    className="text-sm text-indigo-300 hover:text-indigo-200 whitespace-nowrap"
                  >
                    View All
                  </Link>
                </div>
              )}

              {/* Work Pending Review */}
              {pendingServiceCount > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      📋 Work Pending Review ({pendingServiceCount})
                    </p>
                    <p className="mt-1 text-xs text-white/70">
                      Awaiting homeowner verification
                    </p>
                  </div>
                  <Link
                    href="/pro/contractor/service-records?status=pending"
                    className="text-sm text-indigo-300 hover:text-indigo-200 whitespace-nowrap"
                  >
                    View All
                  </Link>
                </div>
              )}

              {/* Clients Needing Follow-up */}
              {needsFollowUp.length > 0 && (
                <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 transition hover:bg-white/10">
                  <div>
                    <p className="text-sm font-medium text-white">
                      ⏰ Clients Needing Follow-up ({needsFollowUp.length})
                    </p>
                    <ul className="mt-1 space-y-0.5 text-xs text-white/70">
                      {needsFollowUp.slice(0, 3).map((conn) => (
                        <li key={conn.id}>
                          • {conn.homeowner?.name || conn.homeowner?.email} (
                          {conn.daysSinceLastService
                            ? `${conn.daysSinceLastService} days`
                            : "No recent contact"}
                          )
                        </li>
                      ))}
                      {needsFollowUp.length > 3 && (
                        <li>+{needsFollowUp.length - 3} more…</li>
                      )}
                    </ul>
                  </div>
                  <Link
                    href="/pro/contractor/properties?filter=needs-attention"
                    className="text-sm text-indigo-300 hover:text-indigo-200 whitespace-nowrap"
                  >
                    View All
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Main Content Grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Recent Work & Clients (2 columns) */}
          <div className="space-y-6 lg:col-span-2">
            {/* Recent Work Records */}
            <div className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${heading}`}>
                    Recent Work
                  </h2>
                  <p className={`text-sm ${textMeta} mt-1`}>
                    Your documented services
                  </p>
                </div>
                <Link
                  href="/pro/contractor/service-records"
                  className="text-sm text-white/70 hover:text-white"
                >
                  View All
                </Link>
              </div>

              {recentService.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                  <p className="mb-2 text-white/80">No work records yet</p>
                  <p className={`mb-4 text-sm ${textMeta}`}>
                    Start documenting the work you do for clients
                  </p>
                  <Link
                    href="/pro/contractor/service-records/new"
                    className={`${ctaPrimary} inline-block px-4 py-2 text-sm`}
                  >
                    Document Services
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentService.map((service) => (
                    <Link
                      key={service.id}
                      href={`/pro/contractor/service-records/${service.id}`}
                      className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-white">
                              {service.serviceType}
                            </h3>
                            {service.isVerified ? (
                              <span className="inline-flex items-center rounded bg-green-400/20 px-2 py-0.5 text-xs font-medium text-green-300">
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-300">
                                Pending
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
                            <span>
                              🏠{" "}
                              {service.home.owner?.name ||
                                service.home.owner?.email}
                            </span>
                            {service.serviceDate && (
                              <span>
                                📅{" "}
                                {new Date(
                                  service.serviceDate
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {service.cost && (
                              <span className="font-medium text-green-300">
                                ${Number(service.cost).toLocaleString()}
                              </span>
                            )}
                          </div>

                          {service.description && (
                            <p className="mt-2 line-clamp-2 text-sm text-white/80">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Your Clients */}
            <div className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${heading}`}>
                    Properties
                  </h2>
                  <p className={`text-sm ${textMeta} mt-1`}>
                    Active relationships
                  </p>
                </div>
                <Link
                  href="/pro/contractor/properties"
                  className="text-sm text-white/70 hover:text-white"
                >
                  View All
                </Link>
              </div>

              {connections.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                  <p className="mb-2 text-white/80">
                    No client connections yet
                  </p>
                  <p className={`mb-4 text-sm ${textMeta}`}>
                    Invite homeowners you&apos;ve worked with
                  </p>
                  <InviteHomeownerButton
                    className={`${ctaPrimary} inline-block px-4 py-2 text-sm`}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.slice(0, 5).map((conn) => (
                    <Link
                      key={conn.id}
                      href={`/pro/contractor/properties/${conn.home?.id}`}
                      className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {conn.homeowner?.image ? (
                            <Image
                              src={conn.homeowner.image}
                              alt={conn.homeowner.name || "Homeowner"}
                              width={40}
                              height={40}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 font-medium text-white">
                              {(
                                conn.homeowner?.name ||
                                conn.homeowner?.email ||
                                "?"
                              )[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-medium text-white">
                            {conn.homeowner?.name ||
                              conn.homeowner?.email?.split("@")[0] ||
                              "Homeowner"}
                          </h3>
                          <p className={`truncate text-sm ${textMeta}`}>
                            {conn.home?.address}
                            {conn.home?.city ? `, ${conn.home.city}` : ""}
                          </p>

                          <div className="mt-1 flex items-center gap-3 text-xs text-white/60">
                            {conn.verifiedServiceCount > 0 && (
                              <span>
                                ✓ {conn.verifiedServiceCount} verified job
                                {conn.verifiedServiceCount !== 1 ? "s" : ""}
                              </span>
                            )}
                            {conn.daysSinceLastService !== null && (
                              <span>
                                {conn.daysSinceLastService === 0
                                  ? "Today"
                                  : `${conn.daysSinceLastService}d ago`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* My Reminders - Coming Soon */}
            <div className={glass}>
              <div className="mb-4">
                <h2 className={`text-xl font-semibold ${heading}`}>
                  My Reminders
                </h2>
                <p className={`text-sm ${textMeta} mt-1`}>
                  Your client follow-ups
                </p>
              </div>

              <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-6 text-center">
                <div className="mb-2 text-4xl">📅</div>
                <p className={`mb-2 text-sm ${textMeta}`}>Coming soon</p>
                <p className={`text-xs ${textMeta}`}>
                  Set reminders to follow up with clients
                </p>
              </div>
            </div>

            {/* More Actions */}
            <div className={glass}>
              <div className="mb-4">
                <h2 className={`text-xl font-semibold ${heading}`}>
                  More Actions
                </h2>
              </div>
              <div className="space-y-2">
                <Link
                  href="/pro/contractor/invitations"
                  className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">✉️</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        All Invitations
                      </p>
                      <p className="text-xs text-white/60">
                        Manage sent invites
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/pro/contractor/service-requests"
                  className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔧</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        All Service Requests
                      </p>
                      <p className="text-xs text-white/60">
                        View quote requests
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/pro/contractor/analytics"
                  className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📊</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        Analytics
                      </p>
                      <p className="text-xs text-white/60">
                        View performance metrics
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/pro/contractor/service-records"
                  className="block rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">📋</span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        All Work Records
                      </p>
                      <p className="text-xs text-white/60">
                        Review documentation
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}