"use client";

import * as React from "react";
import { useMemo, useRef, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { heading, textMeta, glass } from "@/lib/glass";
import { useToast } from "@/components/ui/Toast";
import { EditReminderModal } from "./_components/EditReminderModal";

export type ReminderStatus = "overdue" | "due-soon" | "upcoming" | "completed";

export type ReminderItem = {
  id: string;
  title: string;
  dueAt: string;
  note: string | null;
  formattedDate: string;
  status: ReminderStatus;
  isOverdue: boolean;
  isDueSoon: boolean;
  isCompleted: boolean;
  daysUntil: number;
  attachments: {
    id: string;
    filename: string;
    url: string | null;
    mimeType: string | null;
    size: number;
  }[];
};

type Props = {
  reminders: ReminderItem[];
  homeId: string;
  initialStatus?: string;
  initialSearch?: string;
  initialSort?: string;

  overdueCount: number;
  upcomingCount: number;
  next7DaysCount: number;
  completedCount: number;
  activeCount: number;
  totalVisible: number;

  rightAction?: React.ReactNode;
};

type StatusKey = "active" | "overdue" | "upcoming" | "completed";
type SortKey = "soonest" | "latest" | "title";

/** Match Warranties list cards */
const cardLink =
  "group relative block overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "transition hover:bg-black/30 hover:border-white/15";

/** Tight + consistent filter slab */
const filterSurface = "rounded-2xl border border-white/10 bg-black/20 p-4";

/** Clean glass controls: NO rings, focus via border only */
const fieldShell =
  "rounded-2xl border border-white/25 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

const fieldInner =
  "w-full bg-transparent text-sm text-white outline-none placeholder:text-white/40 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none";

const inputInner = `${fieldInner} px-4 py-2`;
const selectInner = `${fieldInner} px-4 py-2 pr-9 appearance-none`;
const labelCaps = "mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55";

function dueLabel(r: ReminderItem) {
  if (r.isCompleted) return "Completed";
  if (r.isOverdue) {
    const d = Math.abs(r.daysUntil);
    if (d === 0) return "Overdue today";
    if (d === 1) return "1 day overdue";
    return `${d} days overdue`;
  }
  if (r.daysUntil === 0) return "Due today";
  if (r.daysUntil === 1) return "Due tomorrow";
  return `Due in ${r.daysUntil} days`;
}

function statusTextClass(r: ReminderItem) {
  if (r.isCompleted) return "text-emerald-200";
  if (r.isOverdue) return "text-red-300";
  if (r.isDueSoon) return "text-yellow-300";
  return "text-white/60";
}

function truncFilename(name: string) {
  if (name.length <= 28) return name;
  return name.slice(0, 18) + "…" + name.slice(-8);
}

export function RemindersPageClient({
  reminders,
  homeId,
  initialStatus,
  initialSearch,
  initialSort,
  overdueCount,
  upcomingCount,
  next7DaysCount,
  completedCount,
  activeCount,
  rightAction,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState<StatusKey>((initialStatus as StatusKey) || "active");
  const [sort, setSort] = useState<SortKey>((initialSort as SortKey) || "soonest");

  // ✅ parity with Warranties: collapsed by default on mobile, visible on desktop
  const [overviewExpanded, setOverviewExpanded] = useState(false);

  function updateFilters(updates: { search?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      const v = updates.search.trim();
      if (v) params.set("search", v);
      else params.delete("search");
    }

    if (updates.status !== undefined) {
      const v = updates.status;
      if (v && v !== "active") params.set("status", v);
      else params.delete("status");
    }

    if (updates.sort !== undefined) {
      const v = updates.sort;
      if (v && v !== "soonest") params.set("sort", v);
      else params.delete("sort");
    }

    const qs = params.toString();
    router.push(`/home/${homeId}/reminders${qs ? `?${qs}` : ""}`);
  }

  const filteredReminders = useMemo(() => {
    let list = reminders.filter((r) => {
      if (status === "completed") return r.isCompleted;
      if (status === "overdue") return !r.isCompleted && r.status === "overdue";
      if (status === "upcoming") return !r.isCompleted && (r.status === "due-soon" || r.status === "upcoming");
      return !r.isCompleted;
    });

    list = [...list].sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title);
      const da = new Date(a.dueAt).getTime();
      const db = new Date(b.dueAt).getTime();
      return sort === "latest" ? db - da : da - db;
    });

    return list;
  }, [reminders, status, sort]);

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* ✅ Overview (match Warranties) */}
      <section aria-labelledby="overview" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setOverviewExpanded((p) => !p)}
            className="inline-flex items-center gap-2 text-left lg:cursor-default"
            aria-expanded={overviewExpanded}
          >
            <h2 id="overview" className={`text-lg font-semibold ${heading}`}>
              Overview
            </h2>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform lg:hidden ${overviewExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {rightAction ? <div>{rightAction}</div> : null}
        </div>

        <div className={`${overviewExpanded ? "grid" : "hidden"} grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4`}>
          <StatTile label="Overdue" value={overdueCount} />
          <StatTile label="Next 7 Days" value={next7DaysCount} />
          <StatTile label="Upcoming" value={upcomingCount} />
          <StatTile label="Completed" value={completedCount} />
        </div>
      </section>

      {/* ✅ Filters (match Warranties slab + fields) */}
      <section className={filterSurface}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:items-end">
          <div>
            <label className={labelCaps}>Search</label>
            <div className={fieldShell}>
              <input
                className={inputInner}
                value={search}
                placeholder="Search reminders…"
                onChange={(e) => {
                  const v = e.target.value;
                  setSearch(v);
                  updateFilters({ search: v });
                }}
              />
            </div>
          </div>

          <div>
            <label className={labelCaps}>Status</label>
            <div className={`relative ${fieldShell}`}>
              <select
                className={selectInner}
                value={status}
                onChange={(e) => {
                  const v = e.target.value;
                  setStatus(v as StatusKey);
                  updateFilters({ status: v });
                }}
              >
                <option value="active">Active ({activeCount})</option>
                <option value="overdue">Overdue ({overdueCount})</option>
                <option value="upcoming">Upcoming ({upcomingCount})</option>
                <option value="completed">Completed ({completedCount})</option>
              </select>
              <Chevron />
            </div>
          </div>

          <div>
            <label className={labelCaps}>Sort</label>
            <div className={`relative ${fieldShell}`}>
              <select
                className={selectInner}
                value={sort}
                onChange={(e) => {
                  const v = e.target.value;
                  setSort(v as SortKey);
                  updateFilters({ sort: v });
                }}
              >
                <option value="soonest">Soonest First</option>
                <option value="latest">Latest First</option>
                <option value="title">Title (A–Z)</option>
              </select>
              <Chevron />
            </div>
          </div>
        </div>
      </section>

      {/* ✅ List */}
      {filteredReminders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="mb-3 text-white/80">{search.trim() ? "No reminders match your search." : "No reminders yet."}</p>
          <p className={`text-sm ${textMeta}`}>Try a different status or search term.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredReminders.map((rem) => (
            <li key={rem.id} className="list-none">
              <ReminderCard reminder={rem} homeId={homeId} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReminderCard({ reminder, homeId }: { reminder: ReminderItem; homeId: string }) {
  const router = useRouter();
  const { push: toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const confirmTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

  const isCompleted = reminder.isCompleted;
  const isOverdue = reminder.status === "overdue";
  const isDueSoon = reminder.status === "due-soon";

  async function handleComplete() {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}/complete`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      toast("Marked complete.");
      router.refresh();
    } catch {
      toast("Failed to mark complete.");
      setCompleting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast("Reminder deleted.");
      router.refresh();
    } catch {
      toast("Failed to delete reminder.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const leftAccent = isCompleted
    ? "before:bg-emerald-400/70"
    : isOverdue
    ? "before:bg-red-400/80"
    : isDueSoon
    ? "before:bg-yellow-400/80"
    : "before:bg-white/12";

  const statusLabel = isCompleted ? "Completed" : isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Upcoming";

  const statusPill = isCompleted
    ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
    : isOverdue
    ? "border-red-400/25 bg-red-400/10 text-red-100"
    : isDueSoon
    ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-100"
    : "border-white/10 bg-white/5 text-white/60";

  const meta: string[] = [];
  meta.push(`Due: ${reminder.formattedDate}`);
  if (!isCompleted) meta.push(dueLabel(reminder));
  if (reminder.attachments?.length) meta.push(`Attachments: ${reminder.attachments.length}`);

  // If you have a detail page, this will “just work”.
  // If not, you can change href to "#" and keep preventDefault where needed.
  const href = `/home/${homeId}/reminders/${reminder.id}`;

    return (
    <>
      <div
        className={[
          cardLink,
          "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
          leftAccent,
        ].join(" ")}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg">
            ⏰
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-base font-semibold text-white">{reminder.title}</h3>

                  <span
                    className={[
                      "inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-xs",
                      statusPill,
                    ].join(" ")}
                  >
                    {statusLabel}
                  </span>
                </div>

                {meta.length ? <p className="mt-1 truncate text-xs text-white/60">{meta.join(" • ")}</p> : null}

                {reminder.note ? (
                  <p className="mt-2 line-clamp-1 text-xs text-white/65">Note: {reminder.note}</p>
                ) : null}

                {reminder.attachments?.length ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-white/45">📎 {reminder.attachments.length}</span>
                    {reminder.attachments.slice(0, 2).map((att) => (
                      <span
                        key={att.id}
                        className="max-w-[260px] truncate rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/60"
                        title={att.filename}
                      >
                        {truncFilename(att.filename)}
                      </span>
                    ))}
                    {reminder.attachments.length > 2 ? (
                      <span className="text-[11px] text-white/45">+{reminder.attachments.length - 2} more</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
              <span className={statusTextClass(reminder)}>{dueLabel(reminder)}</span>
            </div>

            {/* Hover-only actions (same feel as Warranties) */}
            <div className="mt-3 flex justify-end gap-2 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              {!isCompleted ? (
                <button
                  type="button"
                  disabled={completing || deleting}
                  className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-60"
                  onClick={() => void handleComplete()}
                >
                  {completing ? "Marking…" : "Mark complete"}
                </button>
              ) : null}

              <button
                type="button"
                className="rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10"
                onClick={() => setEditOpen(true)}
              >
                Edit
              </button>

              <button
                type="button"
                disabled={deleting}
                className={[
                  "rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-60",
                  confirmDelete
                    ? "border-red-400/45 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                    : "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/20",
                ].join(" ")}
                onClick={() => {
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
                    confirmTimerRef.current = window.setTimeout(() => setConfirmDelete(false), 2500);
                    return;
                  }
                  void handleDelete();
                }}
              >
                {deleting ? "Deleting…" : confirmDelete ? "Confirm?" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <EditReminderModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        reminder={{ ...reminder, dueAt: new Date(reminder.dueAt) }}
        homeId={homeId}
      />
    </>
  );
}

/* Warranties-sized stat tiles */
function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className={`${glass} p-4`} title={label}>
      <p className={`text-xs ${textMeta} whitespace-nowrap`}>{label}</p>
      <p className="mt-2 text-lg lg:text-xl font-bold text-white">{value}</p>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}