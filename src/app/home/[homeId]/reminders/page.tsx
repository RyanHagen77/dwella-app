import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import HomeTopBar from "@/app/home/_components/HomeTopBar";
import { RemindersPageClient } from "./_components/RemindersPageClient";
import AddRecordButton from "@/app/home/_components/AddRecordButton";

export default async function RemindersPage({
  params,
  searchParams,
}: {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ search?: string; sort?: string }>;
}) {
  const { homeId } = await params;
  const { search, sort } = await searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  // Get home info for header
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

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  // Build query filters
  const where: {
    homeId: string;
    title?: { contains: string; mode: "insensitive" };
  } = { homeId };

  // Search
  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  // Build sort order
  type OrderBy = { dueAt: "asc" | "desc" } | { title: "asc" };
  let orderBy: OrderBy = { dueAt: "asc" }; // Default: soonest first
  if (sort === "latest") orderBy = { dueAt: "desc" };
  if (sort === "title") orderBy = { title: "asc" };

  // Get all reminders
  const reminders = await prisma.reminder.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      dueAt: true,
      note: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },
    },
  });

  // Calculate status on server (avoids hydration issues)
  // Normalize to midnight to ensure consistent calculations
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const remindersWithStatus = reminders.map(r => {
    const dueDate = new Date(r.dueAt);
    dueDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isOverdue = dueDate < now;
    const isDueSoon = !isOverdue && daysUntil <= 7;

    // Format date on server to avoid hydration issues
    const formattedDate = new Date(r.dueAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    return {
      id: r.id,
      title: r.title,
      dueAt: r.dueAt,
      note: r.note,
      isOverdue,
      isDueSoon,
      daysUntil,
      formattedDate,
      attachments: r.attachments,
    };
  });

  // Calculate counts for stats
  const overdueCount = remindersWithStatus.filter(r => r.isOverdue).length;
  const upcomingCount = remindersWithStatus.filter(r => !r.isOverdue).length;
  const next7DaysCount = remindersWithStatus.filter(r => !r.isOverdue && r.daysUntil <= 7).length;

  return (
    <main className="min-h-screen text-white">
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
        <HomeTopBar />

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link href={`/home/${homeId}`} className="text-white/70 hover:text-white transition-colors">
            {addrLine}
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Reminders</span>
        </nav>

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
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>Reminders</h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {remindersWithStatus.length} {remindersWithStatus.length === 1 ? "reminder" : "reminders"}
                </p>
              </div>
            </div>
            <div className="flex-shrink-0">
              <AddRecordButton homeId={homeId} label="+ Add Reminder" defaultType="reminder" />
            </div>
          </div>
        </section>

        {/* Stats Overview */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={remindersWithStatus.length} />
          <StatCard
            label="Overdue"
            value={overdueCount}
            highlight={overdueCount > 0 ? "red" : undefined}
          />
          <StatCard label="Upcoming" value={upcomingCount} />
          <StatCard
            label="Next 7 Days"
            value={next7DaysCount}
            highlight={next7DaysCount > 0 ? "yellow" : undefined}
          />
        </section>

        {/* Client-side component for filters and list */}
        <RemindersPageClient
          reminders={remindersWithStatus}
          homeId={homeId}
          initialSearch={search}
          initialSort={sort}
        />

        <div className="h-12" />
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  highlight
}: {
  label: string;
  value: string | number;
  highlight?: "red" | "yellow";
}) {
  return (
    <div className={glassTight}>
      <div className="text-sm text-white/70">{label}</div>
      <div className={`mt-1 text-xl font-semibold ${
        highlight === "red" ? "text-red-400" :
        highlight === "yellow" ? "text-yellow-400" :
        "text-white"
      }`}>
        {value}
      </div>
    </div>
  );
}