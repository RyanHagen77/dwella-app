"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import { ClaimHomeModal } from "../_components/ClaimHomeModal";
import {
  AddRecordModal,
  type UnifiedRecordPayload,
} from "@/app/home/_components/AddRecordModal";
import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";

import { ClientCard } from "@/app/home/_components/ClientCard";
import { PropertyStats } from "@/app/home/_components/PropertyStats";

import {
  glass,
  glassTight,
  textMeta,
  ctaPrimary,
  ctaGhost,
  heading,
} from "@/lib/glass";

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
const todayISO = () => new Date().toISOString();

function formatDate(
  value: Date | string | null | undefined,
  fallback: string = "—"
): string {
  if (!value) return fallback;
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString();
}

function isWarrantyExpiringSoon(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return false;
  const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  return expiresAt >= now && expiresAt <= in90Days;
}

export default function HomePageSample() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);

  function requireClaim(e?: React.SyntheticEvent) {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    alert("Claim your first home to use this feature.");
    setClaimOpen(true);
  }

  /* ---------- Load sample data ---------- */
  useEffect(() => {
    async function load() {
      setLoading(true);

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
            dueAt: new Date(Date.now() + 5 * 86400000),
          },
          {
            id: "rem2",
            title: "Gutter cleaning",
            dueAt: new Date(Date.now() + 7 * 86400000),
          },
          {
            id: "rem3",
            title: "Water heater flush",
            dueAt: new Date(Date.now() + 7 * 86400000),
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
      setLoading(false);
    }

    load();
  }, []);

  /* ---------- Handler for unified modal ---------- */
  async function onCreateUnified(args: {
    payload: UnifiedRecordPayload;
    files: File[];
  }) {
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
      setData((d) =>
        d ? { ...d, reminders: [newReminder, ...d.reminders] } : d
      );
    } else if (payload.type === "warranty") {
      const newWarranty: Warranty = {
        id: crypto?.randomUUID ? crypto.randomUUID() : String(Date.now()),
        item: payload.item!,
        provider: payload.provider || null,
        expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
      };
      setData((d) =>
        d ? { ...d, warranties: [newWarranty, ...d.warranties] } : d
      );
    }

    setAddOpen(false);
  }

  /* ---------- Loading skeleton ---------- */
  if (loading || !data) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="h-9 w-40 animate-pulse rounded-xl bg-white/10 backdrop-blur-sm" />
          <div className="h-64 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
        </div>
      </main>
    );
  }

  const { property, records, reminders, warranties } = data;

  const addrLine = `${property.address}${
    property.city ? `, ${property.city}` : ""
  }${property.state ? `, ${property.state}` : ""}${
    property.zip ? ` ${property.zip}` : ""
  }`;

  const now = new Date();
  const overdueReminders = reminders.filter((r) => new Date(r.dueAt) < now);
  const upcomingReminders = reminders.filter((r) => new Date(r.dueAt) >= now);
  const expiringSoonWarranties = warranties.filter((w) =>
    isWarrantyExpiringSoon(w.expiresAt, now)
  );

  const stats = {
    yearBuilt: property.yearBuilt ?? null,
    sqft: property.sqft ?? null,
    beds: property.beds ?? null,
    baths: property.baths ?? null,
    estValue: property.estValue ?? null,
    healthScore: property.healthScore ?? null,
    lastUpdated: property.lastUpdated ?? undefined,
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Claim banner */}
        <section
          className={`${glass} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}
        >
          <div>
            <p className="font-medium text-white">This is a sample view.</p>
            <p className={`${textMeta} text-sm`}>
              Claim your home to load your real data and start storing records.
            </p>
          </div>
          <button className={ctaPrimary} onClick={() => setClaimOpen(true)}>
            Claim Your Home
          </button>
        </section>

        {/* Hero card (matches auth page) */}
        <section
          aria-labelledby="home-hero"
          className={`${glass} overflow-visible relative z-[20]`}
        >
          <h2 id="home-hero" className="sr-only">
            Home overview
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
              {/* Photo */}
              <div className="lg:col-span-2">
                <Image
                  src={property.photo}
                  alt={addrLine}
                  width={800}
                  height={450}
                  className="aspect-video w-full rounded-md object-cover"
                />
              </div>

              {/* Right side: picker + address + meta */}
              <div className="flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <SampleHomePicker address={addrLine} onClick={requireClaim} />

                  <h1 className={`text-2xl font-semibold ${heading}`}>
                    {addrLine}
                  </h1>
                  <p className={`text-sm ${textMeta}`}>
                    Last updated {formatDate(stats.lastUpdated)}
                  </p>
                </div>
              </div>
            </div>

            {/* ✅ ClientActions UI clone (no nav, no fetch) */}
            <SampleClientActions
              onAdd={() => requireClaim()}
              onMessages={() => requireClaim()}
              onWantTo={() => requireClaim()}
            />
          </div>
        </section>

        {/* Stats */}
        <div onClickCapture={requireClaim}>
          <PropertyStats homeId={property.id} stats={stats} />
        </div>
        {/* Alerts */}
        {(overdueReminders.length > 0 ||
          expiringSoonWarranties.length > 0) && (
          <section className="space-y-3">
            {overdueReminders.length > 0 && (
              <div className={`${glass} border-l-4 border-red-400`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className={`text-lg font-medium text-red-400 ${heading}`}
                    >
                      ⚠️ Overdue Reminders ({overdueReminders.length})
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {overdueReminders.map((r) => (
                        <li key={r.id} className="text-sm text-white/90">
                          • {r.title} (due {formatDate(r.dueAt)})
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={requireClaim}
                    className={`${ctaPrimary} text-sm`}
                  >
                    View All
                  </button>
                </div>
              </div>
            )}

            {expiringSoonWarranties.length > 0 && (
              <div className={`${glass} border-l-4 border-yellow-400`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3
                      className={`text-lg font-medium text-yellow-400 ${heading}`}
                    >
                      ⏰ Warranties Expiring Soon ({expiringSoonWarranties.length})
                    </h3>
                    <ul className="mt-2 space-y-1">
                      {expiringSoonWarranties.map((w) => (
                        <li key={w.id} className="text-sm text-white/90">
                          • {w.item}{" "}
                          {w.expiresAt && <>expires {formatDate(w.expiresAt)}</>}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={requireClaim}
                    className={`${ctaPrimary} text-sm`}
                  >
                    View All
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Main grid */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            <div onClickCapture={requireClaim}>
              <ClientCard
                title="Recent Maintenance & Repairs"
                viewAllLink="#"
                homeId={property.id}
                addType="record"
              >
                {records.length === 0 ? (
                  <div className="py-8 text-center text-white/70">
                    <p className="mb-3">No records yet</p>
                    <p className="mb-4 text-sm text-white/60">
                      Start tracking your home&apos;s maintenance history
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.map((r) => (
                      <RecordRow
                        key={r.id}
                        record={r}
                        onClick={requireClaim}
                      />
                    ))}
                  </div>
                )}
              </ClientCard>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div onClickCapture={requireClaim}>
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
                      <ReminderRow
                        key={m.id}
                        reminder={m}
                        now={now}
                        onClick={requireClaim}
                      />
                    ))}
                  </ul>
                )}
              </ClientCard>
            </div>

            <div onClickCapture={requireClaim}>
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
                      <WarrantyRow
                        key={w.id}
                        warranty={w}
                        now={now}
                        onClick={requireClaim}
                      />
                    ))}
                  </ul>
                )}
              </ClientCard>
            </div>
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

      <ShareAccessModal
        open={shareOpen}
        onCloseAction={() => setShareOpen(false)}
      />

      <ClaimHomeModal
        open={claimOpen}
        onCloseAction={() => setClaimOpen(false)}
      />
    </main>
  );
}

/* ---------- Sample (non-nav) hero picker ---------- */

function SampleHomePicker({
  address,
  onClick,
}: {
  address: string;
  onClick: (e?: React.SyntheticEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${glassTight} w-full text-left flex items-center justify-between gap-2`}
      aria-label="Claim home to switch properties"
    >
      <div className="min-w-0">
        <p className="text-xs text-white/60">Current home</p>
        <p className="truncate text-sm text-white/90">{address}</p>
      </div>
      <span className="text-white/60 text-sm">▼</span>
    </button>
  );
}

/* ---------- ✅ ClientActions UI clone (no fetch, no nav) ---------- */

function SampleClientActions({
  onAdd,
  onMessages,
  onWantTo,
}: {
  onAdd: () => void;
  onMessages: () => void;
  onWantTo: () => void;
}) {
  // In sample mode, we don’t show counts (or you could hardcode demo counts here)
  const unreadMessagesCount = 0;
  const pendingInvitationsCount = 0;
  const pendingWorkCount = 0;

  return (
    <div className="flex flex-col gap-4 pt-4 sm:pt-2">
      {/* Top row: small pills */}
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <button
          type="button"
          onClick={onAdd}
          className={`${ctaPrimary} whitespace-nowrap text-sm`}
        >
          + Add Record
        </button>

        <button
          type="button"
          onClick={onMessages}
          className={`${ctaGhost} relative whitespace-nowrap text-sm`}
        >
          Messages
          {unreadMessagesCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>

      {/* Big full-width "I want to..." pill */}
      <button
        type="button"
        onClick={onWantTo}
        className={[
          "relative w-full rounded-full px-4 py-3 text-sm font-medium",
          "border border-white/25 bg-black/30 backdrop-blur-md",
          "text-white/90 hover:bg-black/40 hover:border-white/35 transition-colors",
          "flex items-center justify-center",
        ].join(" ")}
      >
        <span className="truncate">I want to...</span>

        {(pendingInvitationsCount > 0 || pendingWorkCount > 0) && (
          <span className="absolute right-3 flex items-center gap-1.5">
            {pendingInvitationsCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-500 px-1.5 text-xs font-bold text-white">
                {pendingInvitationsCount}
              </span>
            )}
            {pendingWorkCount > 0 && (
              <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#33C17D] px-1.5 text-xs font-bold text-white">
                {pendingWorkCount}
              </span>
            )}
          </span>
        )}
      </button>
    </div>
  );
}

/* ---------- Rows (no nav) ---------- */

function RecordRow({
  record,
  onClick,
}: {
  record: RecordItem;
  onClick: (e?: React.SyntheticEvent) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium text-white">{record.title}</h3>
            {record.kind && (
              <span className="inline-flex items-center rounded text-xs font-medium bg-blue-400/20 px-2 py-0.5 text-blue-300">
                {record.kind}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
            {record.date && <span>📅 {formatDate(record.date)}</span>}
            {record.vendor && <span>🔧 {record.vendor}</span>}
            {record.cost != null && (
              <span className="font-medium text-green-300">
                ${Number(record.cost).toLocaleString()}
              </span>
            )}
          </div>

          {record.note && (
            <p className="mt-2 line-clamp-2 text-sm text-white/80">
              {record.note}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

function ReminderRow({
  reminder,
  now,
  onClick,
}: {
  reminder: Reminder;
  now: Date;
  onClick: (e?: React.SyntheticEvent) => void;
}) {
  const dueDate = new Date(reminder.dueAt);
  const isOverdue = dueDate < now;
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white">
            {reminder.title}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-xs font-medium ${
              isOverdue ? "text-red-400" : "text-white/70"
            }`}
          >
            {formatDate(dueDate)}
          </span>
          {!isOverdue && daysUntilDue <= 7 && (
            <span className="text-xs text-yellow-400">
              {daysUntilDue} day{daysUntilDue !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function WarrantyRow({
  warranty,
  now,
  onClick,
}: {
  warranty: Warranty;
  now: Date;
  onClick: (e?: React.SyntheticEvent) => void;
}) {
  const expiresAt = warranty.expiresAt ? new Date(warranty.expiresAt) : null;
  const expiringSoon = isWarrantyExpiringSoon(expiresAt, now);

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-white">
            {warranty.item}
          </h3>
          {warranty.provider && (
            <p className="text-sm text-white/70">{warranty.provider}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          {expiresAt ? (
            <>
              <span
                className={`text-xs font-medium ${
                  expiringSoon ? "text-yellow-400" : "text-white/70"
                }`}
              >
                {formatDate(expiresAt)}
              </span>
              <span className="text-xs text-white/60">Expires</span>
            </>
          ) : (
            <span className="text-xs text-white/60">No expiry</span>
          )}
        </div>
      </div>
    </button>
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