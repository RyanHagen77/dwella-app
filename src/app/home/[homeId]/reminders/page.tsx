/**
 * HOME REMINDERS PAGE
 *
 * Location: src/app/home/[homeId]/reminders/page.tsx
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta, indigoActionLink } from "@/lib/glass";
import AddRecordButton from "@/app/home/_components/AddRecordButton";

import { RemindersPageClient } from "./RemindersPageClient";
import type { ReminderItem } from "./RemindersPageClient";

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

  // Global counts (do NOT depend on current filter)
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

  if (status === "completed") where.archivedAt = { not: null };
  else if (status === "active" || !status) where.archivedAt = null;
  // status === "all" => no archivedAt filter

  if (search?.trim()) where.title = { contains: search.trim(), mode: "insensitive" };

  type OrderBy = { dueAt: "asc" | "desc" } | { title: "asc" };
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
    const due = new Date(r.dueAt);
    due.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const isCompleted = Boolean(r.archivedAt);
    const isOverdue = !isCompleted && due < today;
    const isDueSoon = !isCompleted && !isOverdue && daysUntil <= 7;

    const reminderStatus: ReminderItem["status"] = isCompleted
      ? "completed"
      : isOverdue
      ? "overdue"
      : isDueSoon
      ? "due-soon"
      : "upcoming";

    return {
      id: r.id,
      title: r.title,
      dueAt: r.dueAt.toISOString(),
      note: r.note,
      formattedDate: due.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: reminderStatus,
      isCompleted,
      isOverdue,
      isDueSoon,
      daysUntil,
      attachments: (r.attachments ?? []).map((att) => ({
        id: att.id,
        filename: att.filename,
        url: att.url ?? null,
        mimeType: att.mimeType ?? null,
        size: Number(att.size ?? 0),
      })),
    };
  });

  const visibleActive = remindersWithStatus.filter((r) => !r.isCompleted);
  const overdueCount = visibleActive.filter((r) => r.isOverdue).length;
  const upcomingCount = visibleActive.filter((r) => !r.isOverdue).length;
  const next7DaysCount = visibleActive.filter((r) => !r.isOverdue && r.daysUntil <= 7).length;

  const totalVisible = remindersWithStatus.length;
  const hasAny = totalVisible > 0;

  const IndigoAddReminder = (
    <span className={indigoActionLink}>
      <AddRecordButton homeId={homeId} label="Add reminder" defaultType="reminder" />
    </span>
  );

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

      {/* MATCH Warranties frame */}
      <div className="mx-auto max-w-7xl space-y-6 p-6">
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
        />

        {!hasAny ? (
          <section className="rounded-2xl border border-white/15 bg-black/55 p-8 shadow-2xl backdrop-blur-xl">
            <div className="py-6 text-center">
              <div className="mb-4 text-5xl">⏰</div>
              <h2 className="text-xl font-semibold text-white">No reminders yet</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-white/70">
                Add reminders for seasonal tasks, services, or follow-ups so you never miss a due date.
              </p>
            </div>
          </section>
        ) : (
          <RemindersPageClient
            reminders={remindersWithStatus}
            homeId={homeId}
            initialSearch={search}
            initialSort={sort}
            initialStatus={status}
            overdueCount={overdueCount}
            upcomingCount={upcomingCount}
            next7DaysCount={next7DaysCount}
            completedCount={completedCount}
            activeCount={activeCount}
            totalVisible={totalVisible}
            rightAction={IndigoAddReminder}
          />
        )}

        <div className="h-12" />
      </div>
    </main>
  );
}