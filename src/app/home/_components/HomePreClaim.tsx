"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClaimHomeModal } from "../_components/ClaimHomeModal";
import { AddRecordModal, type UnifiedRecordPayload } from "@/app/home/_components/AddRecordModal";
import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";
import { ClientCard } from "@/app/home/_components/ClientCard";
import { glass, glassTight, textMeta, ctaPrimary, ctaGhost, heading } from "@/lib/glass";
import HomeTopBar from "./HomeContextBar";

/* ---------- Types ---------- */
type RecordItem = {
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

type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  photo: string;
  yearBuilt?: number;
  sqft?: number;
  beds?: number;
  baths?: number;
  estValue?: number;
  healthScore?: number;
  lastUpdated?: string;
};

type HomeData = {
  property: Property;
  records: RecordItem[];
  reminders: Reminder[];
  warranties: Warranty[];
};

/* ---------- Helpers ---------- */
const s = (v: unknown, f = ""): string => (typeof v === "string" && v.length ? v : f);
const n = (v: unknown, f = 0): number => {
  const x = typeof v === "number" ? v : Number(v);
  return Number.isFinite(x) ? x : f;
};
const todayISO = () => new Date().toISOString();

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  /* ---------- Load sample data ---------- */
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Sample data for pre-claim view
      const sampleData: HomeData = {
        property: {
          id: "sample_home_1",
          address: "1842 Maple St",
          city: "Austin",
          state: "TX",
          zip: "78704",
          photo: "/myhomedox_homeowner1.jpg",
          yearBuilt: 2015,
          sqft: 2400,
          beds: 4,
          baths: 3,
          estValue: 450000,
          healthScore: 85,
          lastUpdated: todayISO(),
        },
        records: [
          {
            id: "rec1",
            title: "HVAC Annual Maintenance",
            note: "System cleaned and filters replaced",
            kind: "maintenance",
            date: new Date(2024, 10, 1),
            vendor: "Cool Breeze HVAC",
            cost: 150,
          },
          {
            id: "rec2",
            title: "Roof Inspection",
            note: null,
            kind: "inspection",
            date: new Date(2024, 9, 15),
            vendor: "Apex Roofing",
            cost: 0,
          },
          {
            id: "rec3",
            title: "Water Heater Repair",
            note: "Replaced heating element",
            kind: "repair",
            date: new Date(2024, 8, 22),
            vendor: "Fast Plumbing",
            cost: 285,
          },
        ],
        reminders: [
          {
            id: "rem1",
            title: "Replace HVAC filter",
            dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
          },
          {
            id: "rem2",
            title: "Gutter cleaning",
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
          {
            id: "rem3",
            title: "Water heater flush",
            dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        ],
        warranties: [
          {
            id: "war1",
            item: "Water Heater",
            provider: "AO Smith",
            expiresAt: new Date(2026, 2, 27),
          },
          {
            id: "war2",
            item: "HVAC System",
            provider: "Carrier",
            expiresAt: new Date(2025, 11, 15),
          },
        ],
      };

      setData(sampleData);
      setHydrated(true);
      setLoading(false);
    }

    load();
  }, []);

  /* ---------- Handler for unified modal ---------- */
  async function onCreateUnified(args: { payload: UnifiedRecordPayload; files: File[] }) {
    if (!data) return;
    const { payload } = args;

    if (payload.type === "record") {
      const newRecord: RecordItem = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title: payload.title,
        note: payload.note || null,
        kind: payload.kind || null,
        date: payload.date ? new Date(payload.date) : new Date(),
        vendor: payload.vendor || null,
        cost: typeof payload.cost === "number" ? payload.cost : null,
      };
      setData((d) => (d ? { ...d, records: [newRecord, ...d.records] } : d));
    } else if (payload.type === "reminder") {
      const newReminder: Reminder = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        title: payload.title,
        dueAt: new Date(payload.dueAt!),
      };
      setData((d) => (d ? { ...d, reminders: [newReminder, ...d.reminders] } : d));
    } else if (payload.type === "warranty") {
      const newWarranty: Warranty = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        item: payload.item!,
        provider: payload.provider || null,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      };
      setData((d) => (d ? { ...d, warranties: [newWarranty, ...d.warranties] } : d));
    }

    setAddOpen(false);
  }

  /* ---------- Loading skeleton ---------- */
  if (loading || !data) {
    return (
      <main className="relative min-h-screen text-white">
        <div className="fixed inset-0 -z-50">
          <Image src="/myhomedox_home3.webp" alt="" fill sizes="100vw" className="object-cover object-center" priority />
          <div className="absolute inset-0 bg-black/45" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
        </div>
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="h-9 w-40 animate-pulse rounded-xl bg-white/10 backdrop-blur-sm" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
        </div>
      </main>
    );
  }

  const { property, records, reminders, warranties } = data;
  const addrLine = `${property.address}, ${property.city}, ${property.state} ${property.zip}`;

  // Separate overdue and upcoming reminders
  const now = new Date();
  const overdueReminders = reminders.filter(r => new Date(r.dueAt) < now);
  const upcomingReminders = reminders.filter(r => new Date(r.dueAt) >= now);

  // Separate expiring soon warranties
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
  const expiringSoonWarranties = warranties.filter(w =>
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

        {/* Claim banner */}
        <section className={`${glass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
          <div>
            <p className="font-medium text-white">This is a sample view.</p>
            <p className={`${textMeta} text-sm`}>Claim your home to load your real data and start storing records.</p>
          </div>
          <button className={ctaPrimary} onClick={() => setClaimOpen(true)}>
            Claim Your Home
          </button>
        </section>

        {/* Hero section */}
        <section aria-labelledby="home-hero" className={glass}>
          <h2 id="home-hero" className="sr-only">
            Home overview
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Image
                  src={property.photo}
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
                  {property.lastUpdated
                    ? new Date(property.lastUpdated).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            {/* Actions - matches ClientActions component */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setAddOpen(true)} className={ctaPrimary}>
                + Add Record
              </button>
              <button onClick={() => setShareOpen(true)} className={ctaGhost}>
                Share Access
              </button>
              <a href="/report" className={ctaGhost}>
                View Report
              </a>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section aria-labelledby="stats" className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <Stat label="Health Score" value={property.healthScore != null ? `${property.healthScore}/100` : "—"} hint="A 0–100 score based on recent maintenance." />
          <Stat label="Est. Value" value={property.estValue != null ? `$${Number(property.estValue).toLocaleString()}` : "—"} />
          <Stat label="Beds / Baths" value={`${property.beds ?? "—"} / ${property.baths ?? "—"}`} />
          <Stat label="Sq Ft" value={property.sqft != null ? Number(property.sqft).toLocaleString() : "—"} />
          <Stat label="Year Built" value={property.yearBuilt ?? "—"} />
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
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main content grid - EXACT STRUCTURE */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Recent History */}
          <div className="lg:col-span-2 space-y-6">
            <ClientCard
              title="Recent Maintenance & Repairs"
              viewAllLink="#"
              homeId={property.id}
              addType="record"
            >
              {records.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-3">No records yet</p>
                  <p className="text-sm text-white/60 mb-4">Start tracking your home&apos;s maintenance history</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <RecordItem key={r.id} record={r} homeId={property.id} />
                  ))}
                </div>
              )}
            </ClientCard>
          </div>

          {/* Right column - Reminders & Warranties */}
          <div className="space-y-6">
            <ClientCard
              title="Upcoming Reminders"
              viewAllLink="#"
              homeId={property.id}
              addType="reminder"
            >
              {upcomingReminders.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-2 text-sm">No upcoming reminders</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {upcomingReminders.map((m) => (
                    <ReminderItem key={m.id} reminder={m} homeId={property.id} />
                  ))}
                </ul>
              )}
            </ClientCard>

            <ClientCard
              title="Active Warranties"
              viewAllLink="#"
              homeId={property.id}
              addType="warranty"
            >
              {warranties.length === 0 ? (
                <div className="py-8 text-center text-white/70">
                  <p className="mb-2 text-sm">No warranties on file</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {warranties.map((w) => (
                    <WarrantyItem key={w.id} warranty={w} homeId={property.id} />
                  ))}
                </ul>
              )}
            </ClientCard>
          </div>
        </section>

        <div className="h-12" />
      </div>

      {/* Modals */}
      <AddRecordModal
        open={addOpen}
        onCloseAction={() => setAddOpen(false)}
        onCreateAction={onCreateUnified}
      />

      <ShareAccessModal open={shareOpen} onCloseAction={() => setShareOpen(false)} />

      <ClaimHomeModal open={claimOpen} onCloseAction={() => setClaimOpen(false)} />
    </main>
  );
}

/* ------- Component Helpers - EXACT SAME as authenticated page ------- */

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

function RecordItem({ record, homeId }: { record: RecordItem; homeId: string }) {
  return (
    <Link
      href="#"
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
      href="#"
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
      href="#"
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