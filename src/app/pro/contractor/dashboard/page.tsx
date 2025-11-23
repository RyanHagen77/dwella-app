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
import { InviteHomeownerButton } from "@/app/pro/_components/InviteHomeownerButton";
import { serializeConnections } from "@/lib/serialize";

// Type for connections with computed metrics
type ConnectionWithMetrics = {
  id: string;
  homeownerId: string;
  contractorId: string | null;
  realtorId: string | null;
  inspectorId: string | null;
  homeId: string;
  status: string;
  invitedBy: string;
  invitedAt: Date;
  acceptedAt: Date | null;
  establishedVia: string | null;
  sourceRecordId: string | null;
  verifiedWorkCount: number;
  totalSpent: number | null;
  lastWorkDate: Date | null;
  notes: string | null;
  tags: string[];
  archivedAt: Date | null;
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
    jobRequests: Array<{
      id: string;
      title: string;
      urgency: string;
      createdAt: Date;
    }>;
    warranties: Array<{
      id: string;
      item: string;
      expiresAt: Date | null;
    }>;
    reminders: Array<{
      id: string;
      title: string;
      dueAt: Date;
    }>;
  } | null;
  daysSinceLastWork: number | null;
  relationshipHealth: 'needs-attention' | 'good' | 'excellent';
  pendingRequests: number;
  opportunities: number;
};

export default async function ProDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  if (!session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  if (session.user.proStatus === "PENDING") {
    redirect("/pro/contractor/pending");
  }

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      rating: true,
      verified: true,
    },
  });

  // Get active connections with rich relationship data
  const connections = await prisma.connection.findMany({
    where: { contractorId: userId, status: "ACTIVE" },
    include: {
      homeowner: {
        select: {
          name: true,
          email: true,
          image: true,
        }
      },
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          photos: true,
          // Get pending job requests
          jobRequests: {
            where: {
              contractorId: userId,
              status: { in: ["PENDING", "QUOTED"] },
            },
            select: {
              id: true,
              title: true,
              urgency: true,
              createdAt: true,
            },
          },
          // Get expiring warranties (opportunities!)
          warranties: {
            where: {
              expiresAt: {
                gte: new Date(),
                lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
              }
            },
            select: {
              id: true,
              item: true,
              expiresAt: true,
            },
            take: 3,
          },
          // Get upcoming reminders (opportunities!)
          reminders: {
            where: {
              dueAt: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
              }
            },
            select: {
              id: true,
              title: true,
              dueAt: true,
            },
            take: 3,
          },
        }
      },
    },
    orderBy: { lastWorkDate: "desc" },
  });

  // Infer the connection type from Prisma and add our computed metrics
  const now = new Date();

  // Serialize connections to convert Decimal to number
  const serializedConnections = serializeConnections(connections);

  const connectionsWithMetrics: ConnectionWithMetrics[] = serializedConnections.map(conn => {
    const daysSinceLastWork = conn.lastWorkDate
      ? Math.floor((now.getTime() - new Date(conn.lastWorkDate).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Relationship health: needs attention if >180 days, good if <90 days
    let relationshipHealth: 'needs-attention' | 'good' | 'excellent' = 'good';
    if (daysSinceLastWork === null || daysSinceLastWork > 180) {
      relationshipHealth = 'needs-attention';
    } else if (daysSinceLastWork < 90) {
      relationshipHealth = 'excellent';
    }

    const pendingRequests = conn.home?.jobRequests?.length || 0;
    const opportunities = (conn.home?.warranties?.length || 0) + (conn.home?.reminders?.length || 0);

    return {
      ...conn,
      daysSinceLastWork,
      relationshipHealth,
      pendingRequests,
      opportunities,
    };
  });

  // Prioritize connections:
  // 1. Pending requests (urgent)
  // 2. Needs attention + has opportunities
  // 3. Has opportunities
  // 4. Needs attention
  // 5. Rest by last work date
  const prioritizedConnections = connectionsWithMetrics.sort((a, b) => {
    if (a.pendingRequests > 0 && b.pendingRequests === 0) return -1;
    if (b.pendingRequests > 0 && a.pendingRequests === 0) return 1;

    if (a.relationshipHealth === 'needs-attention' && a.opportunities > 0) {
      if (b.relationshipHealth !== 'needs-attention' || b.opportunities === 0) return -1;
    }
    if (b.relationshipHealth === 'needs-attention' && b.opportunities > 0) {
      if (a.relationshipHealth !== 'needs-attention' || a.opportunities === 0) return 1;
    }

    if (a.opportunities > b.opportunities) return -1;
    if (b.opportunities > a.opportunities) return 1;

    if (a.relationshipHealth === 'needs-attention' && b.relationshipHealth !== 'needs-attention') return -1;
    if (b.relationshipHealth === 'needs-attention' && a.relationshipHealth !== 'needs-attention') return 1;

    return 0;
  });

  // Get counts for different sections
  const needsAttentionCount = connectionsWithMetrics.filter(c => c.relationshipHealth === 'needs-attention').length;
  const totalOpportunities = connectionsWithMetrics.reduce((sum, c) => sum + c.opportunities, 0);
  const totalPendingRequests = connectionsWithMetrics.reduce((sum, c) => sum + c.pendingRequests, 0);

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Header */}
        <section className={glass}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <h1 className={`text-2xl font-semibold ${heading}`}>
                {proProfile?.businessName || "Your Business"}
              </h1>
              <p className={textMeta}>
                {connections.length} active client {connections.length === 1 ? 'relationship' : 'relationships'}
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
        </section>

        {/* Action Overview Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Pending Requests */}
          <Link
            href="/pro/contractor/job-requests"
            className={`${glass} hover:bg-white/10 transition-colors group relative overflow-hidden`}
          >
            {totalPendingRequests > 0 && (
              <div className="absolute top-0 left-0 w-1 h-full bg-orange-400" />
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalPendingRequests}
                </div>
                <p className={`text-sm ${textMeta}`}>Pending Requests</p>
                {totalPendingRequests > 0 && (
                  <p className="text-xs text-orange-300 mt-1">Needs response</p>
                )}
              </div>
              <div className="text-orange-400 text-2xl">💼</div>
            </div>
          </Link>

          {/* Opportunities */}
          <Link
            href="/pro/contractor/properties?filter=opportunities"
            className={`${glass} relative overflow-hidden hover:bg-white/10 transition-colors group`}
          >
            {totalOpportunities > 0 && (
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {totalOpportunities}
                </div>
                <p className={`text-sm ${textMeta}`}>Growth Opportunities</p>
                {totalOpportunities > 0 && (
                  <p className="text-xs text-blue-300 mt-1">Warranties & maintenance</p>
                )}
              </div>
              <div className="text-blue-400 text-2xl">🎯</div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors absolute bottom-3 right-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>

          {/* Needs Attention */}
          <Link
            href="/pro/contractor/properties?filter=needs-attention"
            className={`${glass} relative overflow-hidden hover:bg-white/10 transition-colors group`}
          >
            {needsAttentionCount > 0 && (
              <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
            )}
            <div className="flex items-start justify-between">
              <div>
                <div className="text-3xl font-bold text-white mb-1">
                  {needsAttentionCount}
                </div>
                <p className={`text-sm ${textMeta}`}>Needs Follow-up</p>
                {needsAttentionCount > 0 && (
                  <p className="text-xs text-yellow-300 mt-1">No contact in 6+ months</p>
                )}
              </div>
              <div className="text-yellow-400 text-2xl">⚡</div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-white/40 group-hover:text-white/60 transition-colors absolute bottom-3 right-3"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Client Relationships (2 columns) */}
          <div className="space-y-6 lg:col-span-2">
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${heading}`}>Your Clients</h2>
                  <p className={`text-sm ${textMeta} mt-1`}>
                    Stay connected and grow your business
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
                  <p className="text-white/80 mb-2">
                    No client connections yet
                  </p>
                  <p className={`mb-4 text-sm ${textMeta}`}>
                    Start building relationships with homeowners you&apos;ve worked with
                  </p>
                  <InviteHomeownerButton className={`${ctaPrimary} w-full px-4 py-2 text-sm`} />
                </div>
              ) : (
                <div className="space-y-3">
                  {prioritizedConnections.slice(0, 6).map((conn) => (
                    <ClientCard key={conn.id} connection={conn} />
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Growth Opportunities */}
            <section className={glass}>
              <div className="mb-4">
                <h2 className={`text-xl font-semibold ${heading}`}>Growth Opportunities</h2>
                <p className={`text-sm ${textMeta} mt-1`}>
                  Proactive outreach = more business
                </p>
              </div>

              {totalOpportunities === 0 ? (
                <div className="py-6 text-center">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className={`text-sm ${textMeta} mb-2`}>No opportunities right now</p>
                  <p className={`text-xs ${textMeta}`}>
                    Check back as your clients add warranties and maintenance reminders
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {connectionsWithMetrics
                    .filter(c => c.opportunities > 0)
                    .slice(0, 5)
                    .flatMap(conn => {
                      const items: Array<{
                        type: 'warranty' | 'reminder';
                        homeownerId: string;
                        homeownerName: string | null;
                        homeId: string | undefined;
                        item: string;
                        daysUntil: number;
                      }> = [];

                      // Add warranties
                      conn.home?.warranties?.forEach(w => {
                        if (w.expiresAt) {
                          items.push({
                            type: 'warranty',
                            homeownerId: conn.homeownerId,
                            homeownerName: conn.homeowner?.name || null,
                            homeId: conn.home?.id,
                            item: w.item,
                            daysUntil: Math.ceil((new Date(w.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                          });
                        }
                      });

                      // Add reminders
                      conn.home?.reminders?.forEach(r => {
                        items.push({
                          type: 'reminder',
                          homeownerId: conn.homeownerId,
                          homeownerName: conn.homeowner?.name || null,
                          homeId: conn.home?.id,
                          item: r.title,
                          daysUntil: Math.ceil((new Date(r.dueAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
                        });
                      });

                      return items;
                    })
                    .sort((a, b) => a.daysUntil - b.daysUntil)
                    .slice(0, 5)
                    .map((opp, idx) => (
                      <Link
                        key={`${opp.type}-${opp.homeId}-${idx}`}
                        href={`/pro/contractor/properties/${opp.homeId}`}
                        className={`${glassTight} block hover:bg-white/10 transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-400/10 border border-blue-400/30 flex items-center justify-center">
                            <span className="text-blue-300 text-sm">
                              {opp.type === 'warranty' ? '🛡️' : '🔔'}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">
                              {opp.homeownerName || 'Homeowner'}
                            </p>
                            <p className={`text-xs ${textMeta} truncate`}>
                              {opp.item} {opp.type === 'warranty' ? 'expiring' : 'due'}
                            </p>
                            <p className="text-xs text-blue-300 mt-1">
                              {opp.daysUntil} days • Reach out now
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              )}
            </section>

            {/* Needs Follow-up */}
            {needsAttentionCount > 0 && (
              <section className={glass}>
                <div className="mb-4">
                  <h2 className={`text-xl font-semibold ${heading}`}>Needs Follow-up</h2>
                  <p className={`text-sm ${textMeta} mt-1`}>
                    Stay top-of-mind with past clients
                  </p>
                </div>

                <div className="space-y-3">
                  {connectionsWithMetrics
                    .filter(c => c.relationshipHealth === 'needs-attention')
                    .slice(0, 4)
                    .map((conn) => (
                      <Link
                        key={conn.id}
                        href={`/pro/contractor/properties/${conn.home?.id}`}
                        className={`${glassTight} block hover:bg-white/10 transition-colors`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center">
                            <span className="text-yellow-300 text-sm">⚡</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white text-sm truncate">
                              {conn.homeowner?.name || conn.homeowner?.email || 'Homeowner'}
                            </p>
                            <p className={`text-xs ${textMeta} truncate`}>
                              {conn.home?.address}
                            </p>
                            <p className="text-xs text-yellow-300 mt-1">
                              {conn.daysSinceLastWork ? `${conn.daysSinceLastWork} days since last contact` : 'No recent contact'}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                </div>
              </section>
            )}

            {/* Quick Actions */}
            <section className={glass}>
              <div className="mb-4">
                <h2 className={`text-xl font-semibold ${heading}`}>Quick Actions</h2>
              </div>
              <div className="space-y-2">
                <Link
                  href="/pro/contractor/work-records/new"
                  className={`${glassTight} block hover:bg-white/10 transition-colors`}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xl">📝</span>
                    <span className="text-sm text-white">Document Work</span>
                  </div>
                </Link>

                {/* Invite button styled to match other items */}
                <div className={`${glassTight} hover:bg-white/10 transition-colors`}>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xl">✉️</span>
                    <InviteHomeownerButton className="text-sm text-white text-left flex-1 bg-transparent border-0 p-0" />
                  </div>
                </div>

                <Link
                  href="/pro/messages"
                  className={`${glassTight} block hover:bg-white/10 transition-colors`}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xl">💬</span>
                    <span className="text-sm text-white">Messages</span>
                  </div>
                </Link>
                <Link
                  href="/pro/contractor/work-records"
                  className={`${glassTight} block hover:bg-white/10 transition-colors`}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <span className="text-xl">📋</span>
                    <span className="text-sm text-white">All Work Records</span>
                  </div>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

// Client Card Component - The heart of the relationship view
function ClientCard({ connection }: { connection: ConnectionWithMetrics }) {
  const homeowner = connection.homeowner;
  const home = connection.home;
  const pendingRequests = connection.pendingRequests;
  const opportunities = connection.opportunities;
  const relationshipHealth = connection.relationshipHealth;
  const daysSinceLastWork = connection.daysSinceLastWork;

  // Health indicator color - typed properly
  const healthColors = {
    'excellent': 'border-emerald-400/30 bg-emerald-400/5',
    'good': 'border-blue-400/30 bg-blue-400/5',
    'needs-attention': 'border-yellow-400/30 bg-yellow-400/5',
  } as const;

  const healthDots = {
    'excellent': 'bg-emerald-400',
    'good': 'bg-blue-400',
    'needs-attention': 'bg-yellow-400',
  } as const;

  const healthColor = healthColors[relationshipHealth];
  const healthDot = healthDots[relationshipHealth];

  return (
    <Link
      href={`/pro/contractor/properties/${home?.id}`}
      className={`block rounded-lg border p-4 transition-all hover:bg-white/5 ${healthColor}`}
    >
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {homeowner?.image ? (
            <Image
              src={homeowner.image}
              alt={homeowner.name || "Homeowner"}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
              {(homeowner?.name || homeowner?.email || "?")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-white text-base truncate">
                {homeowner?.name || homeowner?.email?.split('@')[0] || "Homeowner"}
              </h3>
              <p className={`text-sm ${textMeta} truncate`}>
                {home?.address}
                {home?.city ? `, ${home.city}` : ""}
              </p>
            </div>

            {/* Health indicator dot */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${healthDot}`} />
            </div>
          </div>

          {/* Relationship context */}
          <div className="flex items-center gap-3 mt-2 text-xs text-white/60">
            {connection.verifiedWorkCount > 0 && (
              <span>✓ {connection.verifiedWorkCount} verified job{connection.verifiedWorkCount !== 1 ? 's' : ''}</span>
            )}
            {daysSinceLastWork !== null && (
              <span>
                {daysSinceLastWork === 0 ? 'Today' : `${daysSinceLastWork}d ago`}
              </span>
            )}
            {connection.totalSpent && connection.totalSpent > 0 && (
              <span>${connection.totalSpent.toLocaleString()}</span>
            )}
          </div>

          {/* Action items */}
          <div className="mt-3 space-y-2">
            {/* Pending requests - highest priority */}
            {pendingRequests > 0 && home?.jobRequests && home.jobRequests.length > 0 && (
              <div className="rounded-md bg-orange-400/10 border border-orange-400/30 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-orange-300 text-sm">📋</span>
                  <span className="text-sm text-orange-200 font-medium">
                    {home.jobRequests[0].title}
                  </span>
                  {pendingRequests > 1 && (
                    <span className="text-xs text-orange-300/70">
                      +{pendingRequests - 1} more
                    </span>
                  )}
                </div>
                <p className="text-xs text-orange-300/70 mt-1">
                  Needs response
                </p>
              </div>
            )}

            {/* Opportunities - proactive outreach */}
            {opportunities > 0 && pendingRequests === 0 && (
              <div className="space-y-1.5">
                {/* Expiring warranties */}
                {home?.warranties && home.warranties.length > 0 && home.warranties.slice(0, 1).map((warranty) => (
                  <div key={warranty.id} className="rounded-md bg-blue-400/10 border border-blue-400/20 px-3 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-blue-300 text-xs">🛡️</span>
                        <span className="text-xs text-blue-200 truncate">
                          {warranty.item} warranty expiring
                        </span>
                      </div>
                      {warranty.expiresAt && (
                        <span className="text-xs text-blue-300/70 flex-shrink-0">
                          {Math.ceil((new Date(warranty.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* Upcoming reminders */}
                {home?.reminders && home.reminders.length > 0 && home.reminders.slice(0, 1).map((reminder) => (
                  <div key={reminder.id} className="rounded-md bg-blue-400/10 border border-blue-400/20 px-3 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-blue-300 text-xs">🔔</span>
                        <span className="text-xs text-blue-200 truncate">
                          {reminder.title}
                        </span>
                      </div>
                      <span className="text-xs text-blue-300/70 flex-shrink-0">
                        {Math.ceil((new Date(reminder.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}d
                      </span>
                    </div>
                  </div>
                ))}

                {opportunities > 2 && (
                  <p className="text-xs text-blue-300/50 pl-3">
                    +{opportunities - 2} more opportunities
                  </p>
                )}
              </div>
            )}

            {/* Needs attention - no recent activity and no opportunities */}
            {relationshipHealth === 'needs-attention' && opportunities === 0 && pendingRequests === 0 && (
              <div className="rounded-md bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-300 text-xs">💡</span>
                  <span className="text-xs text-yellow-200">
                    Time for a check-in?
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
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