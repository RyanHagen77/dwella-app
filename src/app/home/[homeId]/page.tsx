import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import { glass, glassTight, textMeta, ctaPrimary, heading } from "@/lib/glass";
import ClientActions from "@/app/home/_components/ClientActions";
import { ClientCard } from "@/app/home/_components/ClientCard";

type HomeMeta = {
  attrs?: {
    yearBuilt?: number;
    sqft?: number;
    beds?: number;
    baths?: number;
    estValue?: number;
    healthScore?: number;
    lastUpdated?: string;
  };
};

type Record = {
  id: string;
  title: string;
  note: string | null;
  kind: string | null;
  date: Date | null;
  vendor: string | null;
  cost: number | null;
};

type Reminder = {
  id: string;
  title: string;
  dueAt: Date;
};

type Warranty = {
  id: string;
  item: string;
  provider: string | null;
  expiresAt: Date | null;
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) notFound();

  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      photos: true,
      meta: true,
      records: {
        orderBy: { date: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          note: true,
          kind: true,
          date: true,
          vendor: true,
          cost: true,
        },
      },
      reminders: {
        orderBy: { dueAt: "asc" },
        take: 5,
        select: {
          id: true,
          title: true,
          dueAt: true,
        },
      },
      warranties: {
        orderBy: { expiresAt: "asc" },
        take: 5,
        select: {
          id: true,
          item: true,
          provider: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${home.city ? `, ${home.city}` : ""}${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  const meta = home.meta as HomeMeta | null;
  const attrs = meta?.attrs ?? {};

  const stats = {
    yearBuilt: attrs.yearBuilt ?? undefined,
    sqft: attrs.sqft ?? undefined,
    beds: attrs.beds ?? undefined,
    baths: attrs.baths ?? undefined,
    estValue: attrs.estValue ?? undefined,
    healthScore: attrs.healthScore ?? undefined,
    lastUpdated: attrs.lastUpdated ?? undefined,
  };

  // ✅ Serialize records to convert Decimal to number
  const serializedRecords = home.records.map(record => ({
    ...record,
    cost: record.cost ? Number(record.cost) : null,
  }));

  // Separate overdue and upcoming reminders
  const now = new Date();
  const overdueReminders = home.reminders.filter(r => new Date(r.dueAt) < now);
  const upcomingReminders = home.reminders.filter(r => new Date(r.dueAt) >= now);

  // Separate expiring soon (within 90 days) and active warranties
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
  const expiringSoonWarranties = home.warranties.filter(w =>
    w.expiresAt && new Date(w.expiresAt) <= ninetyDaysFromNow && new Date(w.expiresAt) >= now
  );

  return (
    <main className="relative min-h-screen text-white">
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

        <section aria-labelledby="home-hero" className={glass}>
          <h2 id="home-hero" className="sr-only">
            Home overview
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Image
                  src={home.photos?.[0] ?? "/myhomedox_homeowner1.jpg"}
                  alt={addrLine}
                  width={800}
                  height={450}
                  className="aspect-video w-full rounded-md object-cover"
                />
              </div>

              <div className="space-y-3">
                <h3 className={`text-lg font-medium ${heading}`}>{addrLine}</h3>
                <p className={`text-sm ${textMeta}`}>
                  Last updated{" "}
                  {stats.lastUpdated
                    ? new Date(stats.lastUpdated).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            <ClientActions homeId={home.id} />
          </div>
        </section>

        <section aria-labelledby="stats" className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Stat label="Health Score" value={stats.healthScore != null ? `${stats.healthScore}/100` : "—"} hint="A 0–100 score based on recent maintenance." />
          <Stat label="Est. Value" value={stats.estValue != null ? `$${Number(stats.estValue).toLocaleString()}` : "—"} />
          <Stat label="Beds / Baths" value={`${stats.beds ?? "—"} / ${stats.baths ?? "—"}`} />
          <Stat label="Sq Ft" value={stats.sqft != null ? Number(stats.sqft).toLocaleString() : "—"} />
          <Stat label="Year Built" value={stats.yearBuilt ?? "—"} />
        </section>

        {/* Alert section for overdue items */}
        {(overdueReminders.length > 0 || expiringSoonWarranties.length > 0) && (
          <section className="space-y-3">
            {overdueReminders.length > 0 && (
              <div className={`${glass} border-l-4 border-red-400`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-medium text-red-400 ${heading}`}>
                      ⚠️ Overdue Reminders ({overdueReminders.length})
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {overdueReminders.map((r) => (
                        <li key={r.id} className="text-sm text-white/90">
                          • {r.title} (due {new Date(r.dueAt).toLocaleDateString()})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={`/home/${home.id}/reminders`} className={`${ctaPrimary} text-sm`}>
                    View All
                  </Link>
                </div>
              </div>
            )}

            {expiringSoonWarranties.length > 0 && (
              <div className={`${glass} border-l-4 border-yellow-400`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className={`text-lg font-medium text-yellow-400 ${heading}`}>
                      ⏰ Warranties Expiring Soon ({expiringSoonWarranties.length})
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {expiringSoonWarranties.map((w) => (
                        <li key={w.id} className="text-sm text-white/90">
                          • {w.item} expires {new Date(w.expiresAt!).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Link href={`/home/${home.id}/warranties`} className={`${ctaPrimary} text-sm`}>
                    View All
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main content grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Recent History */}
          <div className="lg:col-span-2 space-y-6">
            <ClientCard
              title="Recent Maintenance & Repairs"
              viewAllLink={`/home/${home.id}/records`}
              homeId={home.id}
              addType="record"
            >
              {serializedRecords.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-3">No records yet</p>
                  <p className="text-sm text-white/60 mb-4">Start tracking your home&apos;s maintenance history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {serializedRecords.map((r) => (
                    <RecordItem key={r.id} record={r} homeId={home.id} />
                  ))}
                </div>
              )}
            </ClientCard>
          </div>

          {/* Right column - Reminders & Warranties */}
          <div className="space-y-6">
            <ClientCard
              title="Upcoming Reminders"
              viewAllLink={`/home/${home.id}/reminders`}
              homeId={home.id}
              addType="reminder"
            >
              {upcomingReminders.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-2 text-sm">No upcoming reminders</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcomingReminders.map((m) => (
                    <ReminderItem key={m.id} reminder={m} homeId={home.id} />
                  ))}
                </ul>
              )}
            </ClientCard>

            <ClientCard
              title="Active Warranties"
              viewAllLink={`/home/${home.id}/warranties`}
              homeId={home.id}
              addType="warranty"
            >
              {home.warranties.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-2 text-sm">No warranties on file</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {home.warranties.map((w) => (
                    <WarrantyItem key={w.id} warranty={w} homeId={home.id} />
                  ))}
                </ul>
              )}
            </ClientCard>
          </div>
        </section>

        <div className="h-12" />
      </div>
    </main>
  );
}

/* ------- Component Helpers ------- */

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={glassTight} role="group" aria-label={label}>
      <div className="flex items-center gap-1 text-sm text-white/70">
        <span>{label}</span>
        {hint && <span aria-label={hint} title={hint} className="cursor-help">ⓘ</span>}
      </div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}

function RecordItem({ record, homeId }: { record: Record; homeId: string }) {
  return (
    <Link
      href={`/home/${homeId}/records/${record.id}`}
      className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-white">{record.title}</h3>
            {record.kind && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-400/20 text-blue-300">
                {record.kind}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-sm text-white/70">
            {record.date && (
              <span>📅 {new Date(record.date).toLocaleDateString()}</span>
            )}
            {record.vendor && (
              <span>🔧 {record.vendor}</span>
            )}
            {record.cost != null && (
              <span className="font-medium text-green-300">
                ${Number(record.cost).toLocaleString()}
              </span>
            )}
          </div>

          {record.note && (
            <p className="mt-2 text-sm text-white/80 line-clamp-2">{record.note}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

function ReminderItem({ reminder, homeId }: { reminder: Reminder; homeId: string }) {
  const dueDate = new Date(reminder.dueAt);
  const isOverdue = dueDate < new Date();
  const daysUntilDue = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Link
      href={`/home/${homeId}/reminders/${reminder.id}`}
      className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{reminder.title}</h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-medium ${isOverdue ? 'text-red-400' : 'text-white/70'}`}>
            {dueDate.toLocaleDateString()}
          </span>
          {!isOverdue && daysUntilDue <= 7 && (
            <span className="text-xs text-yellow-400">
              {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function WarrantyItem({ warranty, homeId }: { warranty: Warranty; homeId: string }) {
  const expiresAt = warranty.expiresAt ? new Date(warranty.expiresAt) : null;
  const isExpiringSoon = expiresAt && expiresAt <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

  return (
    <Link
      href={`/home/${homeId}/warranties/${warranty.id}`}
      className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{warranty.item}</h3>
          {warranty.provider && (
            <p className="text-sm text-white/70">{warranty.provider}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {expiresAt ? (
            <>
              <span className={`text-xs font-medium ${isExpiringSoon ? 'text-yellow-400' : 'text-white/70'}`}>
                {expiresAt.toLocaleDateString()}
              </span>
              <span className="text-xs text-white/60">Expires</span>
            </>
          ) : (
            <span className="text-xs text-white/60">No expiry</span>
          )}
        </div>
      </div>
    </Link>
  );
}