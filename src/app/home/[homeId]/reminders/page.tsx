/**
 * HOME REMINDERS PAGE
 * Location: src/app/home/[homeId]/reminders/page.tsx
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";
import AddRecordButton from "@/app/home/_components/AddRecordButton";

import { RemindersPageClient } from "./RemindersPageClient";
import type { ReminderItem } from "./RemindersPageClient";

type OrderBy = { dueAt: "asc" | "desc" } | { title: "asc" };

function computeStatus(args: { dueAt: Date; archivedAt: Date | null; today: Date }) {
  const { dueAt, archivedAt, today } = args;

  const due = new Date(dueAt);
  due.setHours(0, 0, 0, 0);

  const isCompleted = Boolean(archivedAt);
  const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const isOverdue = !isCompleted && due < today;
  const isDueSoon = !isCompleted && !isOverdue && daysUntil <= 7;

  const status: ReminderItem["status"] = isCompleted
    ? "completed"
    : isOverdue
    ? "overdue"
    : isDueSoon
    ? "due-soon"
    : "upcoming";

  return { isCompleted, isOverdue, isDueSoon, daysUntil, status, due };
}

export default async function RemindersPage({
  params,
  searchParams,
}: {
  params: Promise<{ homeId: string }>;
  searchParams: Promise<{ search?: string; sort?: string; status?: string }>;
}) {
  const { homeId } = await params;
  const { search, sort, status } = await searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();
  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, address: true, city: true, state: true, zip: true },
  });
  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");

  // Global counts (never depend on current filter)
  const [activeCount, completedCount] = await Promise.all([
    prisma.reminder.count({ where: { homeId, archivedAt: null, deletedAt: null } }),
    prisma.reminder.count({ where: { homeId, archivedAt: { not: null }, deletedAt: null } }),
  ]);

  const where: {
    homeId: string;
    deletedAt: null;
    archivedAt?: null | { not: null };
    title?: { contains: string; mode: "insensitive" };
  } = { homeId, deletedAt: null };

  // Keep your prior semantics:
  // - status=completed => archivedAt not null
  // - status=active or missing => archivedAt null
  // - status=all => no archivedAt filter (shows both)
  if (status === "completed") where.archivedAt = { not: null };
  else if (status === "active" || !status) where.archivedAt = null;
  // status === "all" => no archivedAt filter

  if (search?.trim()) where.title = { contains: search.trim(), mode: "insensitive" };

  let orderBy: OrderBy = { dueAt: "asc" };
  if (sort === "latest") orderBy = { dueAt: "desc" };
  if (sort === "title") orderBy = { title: "asc" };

  const reminders = await prisma.reminder.findMany({
    where,
    orderBy,
    select: {
      id: true,
      title: true,
      dueAt: true,
      note: true,
      archivedAt: true,
      attachments: { select: { id: true, filename: true, url: true, mimeType: true, size: true } },
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const remindersWithStatus: ReminderItem[] = reminders.map((r) => {
    const s = computeStatus({ dueAt: r.dueAt, archivedAt: r.archivedAt, today });

    return {
      id: r.id,
      title: r.title,
      dueAt: r.dueAt.toISOString(),
      note: r.note,
      formattedDate: s.due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: s.status,
      isCompleted: s.isCompleted,
      isOverdue: s.isOverdue,
      isDueSoon: s.isDueSoon,
      daysUntil: s.daysUntil,
      attachments: r.attachments.map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url ?? null,
        mimeType: att.mimeType ?? null,
        size: Number(att.size ?? 0),
      })),
    };
  });

  // Visible counts for the tiles (based on returned list)
  const visibleActive = remindersWithStatus.filter((r) => !r.isCompleted);
  const overdueCount = visibleActive.filter((r) => r.isOverdue).length;
  const next7DaysCount = visibleActive.filter((r) => !r.isOverdue && r.daysUntil <= 7).length;
  const upcomingCount = visibleActive.filter((r) => !r.isOverdue && r.daysUntil > 7).length;

  return (
    <main className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-50">
        <Image src="/myhomedox_home3.webp" alt="" fill sizes="100vw" className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <div className="w-full space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: addrLine, href: `/home/${homeId}` }, { label: "Reminders" }]} />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Reminders"
          meta={
            <span className={textMeta}>
              {activeCount} active • {completedCount} completed
            </span>
          }
          rightDesktop={<AddRecordButton homeId={homeId} label="+ Add Reminder" defaultType="reminder" />}
        />

        {/* ✅ Tiles are now toggled on mobile (like PropertyStats) */}
        <RemindersPageClient
          reminders={remindersWithStatus}
          homeId={homeId}
          initialSearch={search}
          initialSort={sort}
          initialStatus={status}
          activeCount={activeCount}
          completedCount={completedCount}
          overdueCount={overdueCount}
          upcomingCount={upcomingCount + next7DaysCount}
          next7DaysCount={next7DaysCount}
        />

        <div className="h-12" />
      </div>
    </main>
  );
}