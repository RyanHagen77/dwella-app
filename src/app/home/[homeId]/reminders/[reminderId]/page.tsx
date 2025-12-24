import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import { ReminderActions } from "./ReminderActions";
import Breadcrumb from "@/components/ui/Breadcrumb";

export default async function ReminderDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; reminderId: string }>;
}) {
  const { homeId, reminderId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  // Get the reminder + attachments
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    select: {
      id: true,
      title: true,
      dueAt: true,
      note: true,
      homeId: true,
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true, // ✅ include url so we can pass string|null through to ReminderData
          mimeType: true,
          size: true, // BigInt in DB
        },
      },
    },
  });

  if (!reminder || reminder.homeId !== homeId) notFound();

  // Home for breadcrumb
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { address: true, city: true, state: true, zip: true },
  });

  if (!home) notFound();

  const addrLine =
    `${home.address}` +
    `${home.city ? `, ${home.city}` : ""}` +
    `${home.state ? `, ${home.state}` : ""}` +
    `${home.zip ? ` ${home.zip}` : ""}`;

  // Calculate status (date-based, not time-of-day sensitive)
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const dueDate = new Date(reminder.dueAt);
  dueDate.setHours(0, 0, 0, 0);

  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isDueSoon = !isOverdue && daysUntilDue <= 7;

  // Map attachments with bigint -> number; keep url as string|null (matches ReminderData)
  const attachments = (reminder.attachments ?? []).map((att) => ({
    id: att.id,
    filename: att.filename,
    url: att.url ?? null, // ✅ allow null
    mimeType: att.mimeType ?? null,
    size: att.size == null ? null : Number(att.size),
    // handy for rendering "View" links
    viewHref: `/api/home/${homeId}/attachments/${att.id}`,
  }));

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Reminders", href: `/home/${homeId}/reminders` },
            { label: reminder.title },
          ]}
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Link
                href={`/home/${homeId}/reminders`}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to reminders"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className={`truncate text-2xl font-bold ${heading}`}>{reminder.title}</h1>

                  {isOverdue ? (
                    <span className="inline-flex items-center rounded border border-red-400/30 bg-red-400/20 px-2 py-1 text-xs font-medium text-red-300">
                      Overdue
                    </span>
                  ) : isDueSoon ? (
                    <span className="inline-flex items-center rounded border border-yellow-400/30 bg-yellow-400/20 px-2 py-1 text-xs font-medium text-yellow-300">
                      Due Soon
                    </span>
                  ) : null}
                </div>

                <p className={`text-sm ${textMeta}`}>
                  Due{" "}
                  {dueDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {isOverdue ? (
                    <span className="ml-2 text-red-400">
                      ({Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? "s" : ""} overdue)
                    </span>
                  ) : isDueSoon ? (
                    <span className="ml-2 text-yellow-400">
                      (
                      {daysUntilDue === 0
                        ? "Due today"
                        : daysUntilDue === 1
                        ? "Due tomorrow"
                        : `${daysUntilDue} days away`}
                      )
                    </span>
                  ) : null}
                </p>
              </div>
            </div>

            <ReminderActions
              reminderId={reminder.id}
              homeId={homeId}
              reminder={{
                id: reminder.id,
                title: reminder.title,
                dueAt: reminder.dueAt,
                note: reminder.note,
                attachments: attachments.map((a) => ({
                  id: a.id,
                  filename: a.filename,
                  url: a.url, // ✅ string | null
                  mimeType: a.mimeType,
                  size: a.size, // ✅ number | null (compatible with number|bigint|null)
                })),
              }}
            />
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Details + Attachments */}
          <div className="lg:col-span-2">
            <section className={glass}>
              <h2 className={`mb-4 text-lg font-medium ${heading}`}>Details</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailField
                  label="Due Date"
                  value={dueDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <DetailField label="Status" value={isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Upcoming"} />
              </div>

              {reminder.note ? (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Notes</div>
                  <p className="whitespace-pre-wrap text-sm text-white/80">{reminder.note}</p>
                </div>
              ) : null}

              {/* Attachments */}
              <div className="mt-4 border-t border-white/10 pt-4">
                <div className={`mb-2 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Attachments</div>

                {attachments.length === 0 ? (
                  <p className="text-sm text-white/60">No attachments.</p>
                ) : (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 p-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm text-white">{att.filename}</p>
                          <p className="text-xs text-white/60">
                            {att.mimeType ?? "Attachment"}
                            {att.size != null ? ` • ${(Number(att.size) / 1024).toFixed(1)} KB` : ""}
                          </p>
                        </div>

                        {/* Use <a> for opening files */}
                        <a
                          href={att.viewHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/15"
                        >
                          View
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Right column - Metadata */}
          <div>
            <section className={glassTight}>
              <h3 className="mb-3 text-sm font-medium text-white/70">Reminder Info</h3>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-white/60">Days until due</span>
                  <span
                    className={`font-medium ${
                      isOverdue ? "text-red-400" : isDueSoon ? "text-yellow-400" : "text-white"
                    }`}
                  >
                    {isOverdue
                      ? `${Math.abs(daysUntilDue)} overdue`
                      : daysUntilDue === 0
                      ? "Today"
                      : daysUntilDue === 1
                      ? "Tomorrow"
                      : daysUntilDue}
                  </span>
                </div>

                <div className="flex justify-between gap-4">
                  <span className="text-white/60">Due date</span>
                  <span className="text-white">{dueDate.toLocaleDateString()}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="h-12" />
      </div>
    </main>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className={`mb-1 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>{label}</div>
      <div className="font-medium text-white">{value}</div>
    </div>
  );
}