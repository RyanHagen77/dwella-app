/**
 * HOME REMINDER DETAIL PAGE
 *
 * Location: app/home/[homeId]/reminders/[reminderId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { heading, textMeta } from "@/lib/glass";
import { ReminderActions } from "./ReminderActions";

const insetSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";

function formatLongDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default async function ReminderDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; reminderId: string }>;
}) {
  const { homeId, reminderId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    select: {
      id: true,
      title: true,
      dueAt: true,
      note: true,
      homeId: true,
      archivedAt: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true, // ✅ needed for ReminderData typing (string | null)
          mimeType: true,
          size: true, // BigInt in DB
        },
      },
    },
  });

  if (!reminder || reminder.homeId !== homeId) notFound();

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });

  if (!home) notFound();

  const addrLine = [home.address, home.city, home.state, home.zip].filter(Boolean).join(", ");
  const backHref = `/home/${homeId}/reminders`;

  // Status (date-based; not time-of-day sensitive)
  const today = startOfDay(new Date());
  const dueDay = startOfDay(new Date(reminder.dueAt));
  const isCompleted = Boolean(reminder.archivedAt);
  const isOverdue = !isCompleted && dueDay < today;

  const daysUntilDue = Math.ceil((dueDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isDueSoon = !isCompleted && !isOverdue && daysUntilDue <= 7;

  // Normalize attachments (BigInt -> number; keep url nullable)
  const attachments = (reminder.attachments ?? []).map((a) => ({
    id: a.id,
    filename: a.filename,
    url: a.url ?? null,
    mimeType: a.mimeType ?? null,
    size: a.size == null ? null : typeof a.size === "bigint" ? Number(a.size) : Number(a.size),
  }));

  const imageAttachments = attachments.filter((a) => a.mimeType?.startsWith("image/"));
  const docAttachments = attachments.filter((a) => !a.mimeType?.startsWith("image/"));

  const longDue = formatLongDate(reminder.dueAt);

  // What we pass into ReminderActions/EditReminderModal (matches your updated ReminderData)
  const reminderForActions = {
    id: reminder.id,
    title: reminder.title,
    dueAt: reminder.dueAt,
    note: reminder.note,
    attachments,
  };

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Reminders", href: backHref },
            { label: reminder.title },
          ]}
        />

        {/* Header (matches Records detail pattern) */}
        <header className="flex items-start justify-between gap-3">
          {/* Left */}
          <div className="flex min-w-0 items-start gap-3">
            <Link
              href={backHref}
              aria-label="Back to reminders"
              className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
            >
              ←
            </Link>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`truncate text-2xl font-bold ${heading}`}>{reminder.title}</h1>

                {isCompleted ? (
                  <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                    Completed
                  </span>
                ) : isOverdue ? (
                  <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200">
                    Overdue
                  </span>
                ) : isDueSoon ? (
                  <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                    Due soon
                  </span>
                ) : null}
              </div>

              {/* ONE-LINE meta (scroll instead of wrap/truncate) */}
              <div className="mt-2">
                <div className="max-w-full overflow-x-auto whitespace-nowrap [-webkit-overflow-scrolling:touch]">
                  <span className={`text-sm ${textMeta}`}>
                    📅 Due {longDue}
                    {!isCompleted ? (
                      <>
                        {" "}
                        •{" "}
                        {isOverdue
                          ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`
                          : daysUntilDue === 0
                          ? "Due today"
                          : daysUntilDue === 1
                          ? "Due tomorrow"
                          : `${daysUntilDue} days away`}
                      </>
                    ) : null}
                    {attachments.length ? ` • 📎 ${attachments.length} attachment${attachments.length === 1 ? "" : "s"}` : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex flex-shrink-0 items-start">
            <ReminderActions reminderId={reminderId} homeId={homeId} reminder={reminderForActions} />
          </div>
        </header>

        {/* Single body surface (matches Records) */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-8">
            {/* Details */}
            <div className={cardSurface}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Due date</div>
                  <div className="mt-1 font-medium text-white">{longDue}</div>
                </div>

                <div>
                  <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Status</div>
                  <div className="mt-1 font-medium text-white">
                    {isCompleted ? "Completed" : isOverdue ? "Overdue" : isDueSoon ? "Due soon" : "Upcoming"}
                  </div>
                </div>

                {!isCompleted ? (
                  <div>
                    <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Countdown</div>
                    <div
                      className={[
                        "mt-1 font-medium",
                        isOverdue ? "text-red-300" : isDueSoon ? "text-yellow-300" : "text-white",
                      ].join(" ")}
                    >
                      {isOverdue
                        ? `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? "" : "s"} overdue`
                        : daysUntilDue === 0
                        ? "Due today"
                        : daysUntilDue === 1
                        ? "Due tomorrow"
                        : `${daysUntilDue} days away`}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Notes */}
              {reminder.note ? (
                <div className="mt-6">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Notes</div>
                  <div className={insetSurface}>
                    <p className="whitespace-pre-wrap text-sm text-white/85">{reminder.note}</p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Attachments */}
            {attachments.length > 0 ? (
              <div className={cardSurface}>
                <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Attachments ({attachments.length})</h2>

                {/* Photos */}
                {imageAttachments.length > 0 ? (
                  <div className="mb-8">
                    <div className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>
                      Photos ({imageAttachments.length})
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {imageAttachments.map((a) => {
                        const href = `/api/home/${homeId}/attachments/${a.id}`;
                        return (
                          <a
                            key={a.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative aspect-square overflow-hidden rounded-2xl border border-white/10 bg-black/20"
                          >
                            <Image
                              src={href}
                              alt={a.filename}
                              fill
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                              className="object-cover"
                            />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {/* Documents */}
                {docAttachments.length > 0 ? (
                  <div>
                    <div className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>
                      Documents ({docAttachments.length})
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {docAttachments.map((a) => {
                        const href = `/api/home/${homeId}/attachments/${a.id}`;
                        const sizeKb = a.size != null ? (Number(a.size) / 1024).toFixed(1) : null;

                        return (
                          <a
                            key={a.id}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4 transition-colors hover:bg-black/25"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20">
                              <span className="text-lg">{a.mimeType?.includes("pdf") ? "📄" : "📎"}</span>
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="truncate text-sm font-medium text-white">{a.filename}</div>
                              <div className="text-xs text-white/60">
                                {a.mimeType ?? "Document"}
                                {sizeKb ? ` • ${sizeKb} KB` : ""}
                              </div>
                            </div>

                            <span className="text-xs text-white/60">Open</span>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}