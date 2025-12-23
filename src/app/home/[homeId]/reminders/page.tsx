/**
 * HOME REMINDERS PAGE
 *
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

  // ✅ counts should NOT depend on the current status filter
  const [activeCount, completedCount] = await Promise.all([
    prisma.reminder.count({ where: { homeId, archivedAt: null } }),
    prisma.reminder.count({ where: { homeId, archivedAt: { not: null } } }),
  ]);

  const where: {
    homeId: string;
    archivedAt?: null | { not: null };
    title?: { contains: string; mode: "insensitive" };
  } = { homeId };

  if (status === "completed") where.archivedAt = { not: null };
  else if (status === "active" || !status) where.archivedAt = null;
  // status === "all" => no archivedAt filter

  if (search) where.title = { contains: search, mode: "insensitive" };

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

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const remindersWithStatus: ReminderItem[] = reminders.map((r) => {
    const dueDate = new Date(r.dueAt);
    dueDate.setHours(0, 0, 0, 0);

    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const isCompleted = Boolean(r.archivedAt);
    const isOverdue = !isCompleted && dueDate < now;
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
      isCompleted,
      isOverdue,
      isDueSoon,
      daysUntil,
      formattedDate: dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: reminderStatus,
      attachments: r.attachments.map((att) => ({
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

  return (
    <main className="relative min-h-screen text-white">
      <div className="fixed inset-0 -z-50">
        <Image src="/myhomedox_home3.webp" alt="" fill sizes="100vw" className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={[{ label: addrLine, href: `/home/${homeId}` }, { label: "Reminders" }]} />

        <PageHeader
          backHref={`/home/${homeId}`}
          backLabel="Back to home"
          title="Reminders"
          meta={
            <span>
              {totalVisible} {totalVisible === 1 ? "reminder" : "reminders"}
            </span>
          }
          rightDesktop={<AddRecordButton homeId={homeId} label="+ Add Reminder" defaultType="reminder" />}
        />

        {/* ✅ swap + drop Total */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard label="Upcoming" value={upcomingCount} />
          <StatCard label="Overdue" value={overdueCount} highlight={overdueCount > 0 ? "red" : undefined} />
          <StatCard label="Next 7 Days" value={next7DaysCount} highlight={next7DaysCount > 0 ? "yellow" : undefined} />
          <StatCard label="Completed" value={completedCount} />
        </section>

        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-6 sm:hidden">
            <AddRecordButton homeId={homeId} label="+ Add Reminder" defaultType="reminder" />
          </div>

          <RemindersPageClient
            reminders={remindersWithStatus}
            homeId={homeId}
            initialSearch={search}
            initialSort={sort}
            initialStatus={status}
            overdueCount={overdueCount}
            upcomingCount={upcomingCount}
            completedCount={completedCount} // ✅ now global
            activeCount={activeCount} // ✅ now global
          />
        </section>

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
  highlight?: "red" | "yellow";
}) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">{label}</div>
      <div
        className={[
          "mt-1 text-lg font-semibold leading-tight",
          highlight === "red" ? "text-red-300" : highlight === "yellow" ? "text-yellow-300" : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}