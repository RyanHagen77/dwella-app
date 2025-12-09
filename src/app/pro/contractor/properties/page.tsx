/**
 * PRO PROPERTIES PAGE
 *
 * Shows all properties the contractor has worked on.
 * Includes Active/Archived toggle for disconnected homeowners.
 *
 * Location: app/(pro)/pro/contractor/properties/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { PropertiesClient } from "./PropertiesClient";
import { glass, heading, textMeta } from "@/lib/glass";

export default async function PropertiesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || session.user.role !== "PRO") {
    redirect("/login");
  }

  const userId = session.user.id as string;

  // Get all connections (both active and archived) for this contractor
  const connections = await prisma.connection.findMany({
    where: {
      contractorId: userId,
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    include: {
      homeowner: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
      home: {
        select: {
          id: true,
          address: true,
          city: true,
          state: true,
          zip: true,
          photos: true,
          // Get opportunities (only relevant for active)
          warranties: {
            where: {
              expiresAt: {
                gte: new Date(),
                lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              },
            },
            select: {
              id: true,
              item: true,
              expiresAt: true,
            },
          },
          reminders: {
            where: {
              dueAt: {
                gte: new Date(),
                lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            },
            select: {
              id: true,
              title: true,
              dueAt: true,
            },
          },
          // Get pending service requests
          serviceRequests: {
            where: {
              contractorId: userId,
              status: { in: ["PENDING", "QUOTED"] },
            },
            select: {
              id: true,
              title: true,
              urgency: true,
            },
          },
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get work records
  const homeIds = connections.map((c) => c.homeId);

  const serviceRecords = await prisma.serviceRecord.findMany({
    where: {
      contractorId: userId,
      homeId: { in: homeIds },
    },
    select: {
      id: true,
      homeId: true,
      serviceDate: true,
      serviceType: true,
      description: true,
    },
    orderBy: {
      serviceDate: "desc",
    },
  });

  // Transform data for client with all required fields
  const now = Date.now();

  const properties = connections.map((conn) => {
    const home = conn.home;
    const records = serviceRecords.filter((r) => r.homeId === conn.homeId);
    const lastService = records.length > 0 ? records[0] : null;
    const isArchived = conn.status === "ARCHIVED";

    // Calculate relationship metrics
    const daysSinceLastService = conn.lastServiceDate
      ? Math.floor(
          (now - new Date(conn.lastServiceDate).getTime()) / (1000 * 60 * 60 * 24)
        )
      : null;

    // Process opportunities (only for active connections)
    const expiringWarranties = isArchived
      ? []
      : home?.warranties?.map((w) => ({
          item: w.item,
          expiresAt: w.expiresAt!.toISOString(),
          daysUntil: Math.ceil(
            (new Date(w.expiresAt!).getTime() - now) / (1000 * 60 * 60 * 24)
          ),
        })) || [];

    const upcomingReminders = isArchived
      ? []
      : home?.reminders?.map((r) => ({
          title: r.title,
          dueAt: r.dueAt.toISOString(),
          daysUntil: Math.ceil(
            (new Date(r.dueAt).getTime() - now) / (1000 * 60 * 60 * 24)
          ),
        })) || [];

    // No pending requests for archived connections
    const pendingRequests = isArchived
      ? []
      : home?.serviceRequests?.map((req) => ({
          id: req.id,
          title: req.title,
          urgency: req.urgency,
        })) || [];

    return {
      id: conn.homeId,
      connectionId: conn.id,
      address: home?.address ?? "Unknown Address",
      city: home?.city ?? "",
      state: home?.state ?? "",
      zip: home?.zip ?? "",
      homeownerName:
        conn.homeowner?.name ?? conn.homeowner?.email ?? "Unknown",
      homeownerEmail: conn.homeowner?.email ?? "",
      homeownerImage: conn.homeowner?.image ?? null,
      connectionStatus: conn.status,
      isArchived,
      archivedAt: conn.archivedAt?.toISOString() || null,
      verifiedServiceCount: conn.verifiedServiceCount,
      totalSpent: Number(conn.totalSpent) || null,
      serviceCount: records.length,
      lastServiceDate: lastService?.serviceDate?.toISOString() ?? null,
      lastServiceTitle: lastService?.serviceType ?? lastService?.description ?? null,
      daysSinceLastService,
      imageUrl: home?.photos?.[0] ?? null,
      expiringWarranties,
      upcomingReminders,
      pendingRequests,
    };
  });

  // Separate active and archived
  const activeProperties = properties.filter((p) => !p.isArchived);
  const archivedProperties = properties.filter((p) => p.isArchived);

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Properties</span>
        </nav>

        {/* Header w/ back arrow */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href="/pro/contractor/dashboard"
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
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
                  d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>

            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>Properties</h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                Homes you&apos;ve worked on and maintained.
              </p>
              <p className={`mt-1 text-xs ${textMeta}`}>
                {activeProperties.length} active propert
                {activeProperties.length === 1 ? "y" : "ies"}
              </p>
            </div>
          </div>
        </section>

        {/* Filter + grid UI (client component) */}
        <PropertiesClient
          activeProperties={activeProperties}
          archivedProperties={archivedProperties}
        />
      </div>
    </main>
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