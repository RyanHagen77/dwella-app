import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, heading } from "@/lib/glass";
import HomeTopBar from "@/app/home/_components/HomeContextBar";
import { ReminderActions } from "./_components/ReminderActions";

export default async function ReminderDetailPage({
  params,
}: {
  params: Promise<{ homeId: string; reminderId: string }>;
}) {
  const { homeId, reminderId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  // Get the reminder
  const reminder = await prisma.reminder.findUnique({
    where: { id: reminderId },
    select: {
      id: true,
      title: true,
      dueAt: true,
      note: true,
      homeId: true,
    },
  });

  if (!reminder || reminder.homeId !== homeId) notFound();

  // Get home info for breadcrumb
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  // Calculate status
  const now = new Date();
  const dueDate = new Date(reminder.dueAt);
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isDueSoon = !isOverdue && daysUntilDue <= 7;

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
          <Link href={`/home/${homeId}/reminders`} className="text-white/70 hover:text-white transition-colors">
            Reminders
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white truncate max-w-xs">{reminder.title}</span>
        </nav>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={`/home/${homeId}/reminders`}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to reminders"
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
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h1 className={`text-2xl font-bold ${heading} truncate`}>{reminder.title}</h1>
                  {isOverdue && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-400/20 text-red-300 border border-red-400/30">
                      Overdue
                    </span>
                  )}
                  {isDueSoon && (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                      Due Soon
                    </span>
                  )}
                </div>
                <p className={`text-sm ${textMeta}`}>
                  Due {dueDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {isOverdue && (
                    <span className="text-red-400 ml-2">
                      ({Math.abs(daysUntilDue)} day{Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue)
                    </span>
                  )}
                  {isDueSoon && !isOverdue && (
                    <span className="text-yellow-400 ml-2">
                      ({daysUntilDue === 0 ? 'Due today' : daysUntilDue === 1 ? 'Due tomorrow' : `${daysUntilDue} days away`})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <ReminderActions
              reminderId={reminderId}
              homeId={homeId}
              reminder={{
                id: reminder.id,
                title: reminder.title,
                dueAt: reminder.dueAt,
                note: reminder.note,
              }}
            />
          </div>
        </section>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Details */}
          <div className="lg:col-span-2">
            <section className={glass}>
              <h2 className={`text-lg font-medium ${heading} mb-4`}>Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <DetailField
                  label="Due Date"
                  value={dueDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                />
                <DetailField
                  label="Status"
                  value={isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Upcoming"}
                />
              </div>

              {reminder.note && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="text-sm text-white/60 uppercase tracking-wide mb-2">Notes</div>
                  <p className="text-white/85 whitespace-pre-wrap">{reminder.note}</p>
                </div>
              )}
            </section>
          </div>

          {/* Right column - Metadata */}
          <div>
            <section className={glassTight}>
              <h3 className="text-sm font-medium text-white/70 mb-3">Reminder Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Days Until Due</span>
                  <span className={`font-medium ${
                    isOverdue ? "text-red-400" : 
                    isDueSoon ? "text-yellow-400" : 
                    "text-white"
                  }`}>
                    {isOverdue ? `${Math.abs(daysUntilDue)} overdue` :
                     daysUntilDue === 0 ? "Today" :
                     daysUntilDue === 1 ? "Tomorrow" :
                     daysUntilDue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Due Date</span>
                  <span className="text-white">
                    {dueDate.toLocaleDateString()}
                  </span>
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
      <div className="text-xs text-white/60 uppercase tracking-wide mb-1">{label}</div>
      <div className="text-white font-medium">{value}</div>
    </div>
  );
}