"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { textMeta } from "@/lib/glass";
import { useToast } from "@/components/ui/Toast";

import {
  formFieldShell,
  formInputInner,
  formSelectInner,
  formLabelCaps,
} from "@/components/ui/formFields";

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

  // global counts
  activeCount: number;
  completedCount: number;

  // visible counts (for status dropdown labels)
  overdueCount: number;
  upcomingCount: number;
  next7DaysCount: number;
};

const tileSurface = "rounded-2xl border border-white/10 bg-black/20 px-4 py-3 backdrop-blur";
const rowSurface =
  "rounded-2xl bg-black/25 px-4 py-3 backdrop-blur transition hover:bg-black/30"; // ✅ no border = no “broken border” look

export function RemindersPageClient({
  reminders,
  homeId,
  initialStatus,
  initialSearch,
  initialSort,
  activeCount,
  completedCount,
  overdueCount,
  upcomingCount,
  next7DaysCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState(initialStatus || "all");
  const [sort, setSort] = useState(initialSort || "soonest");

  // ✅ mobile stats: collapsed by default (PropertyStats style)
  const [statsOpen, setStatsOpen] = useState(false);

  function updateFilters(updates: { search?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      const v = updates.search.trim();
      if (v) params.set("search", v);
      else params.delete("search");
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") params.set("status", updates.status);
      else params.delete("status");
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "soonest") params.set("sort", updates.sort);
      else params.delete("sort");
    }

    const qs = params.toString();
    router.push(`/home/${homeId}/reminders${qs ? `?${qs}` : ""}`);
  }

  // Client-side status view (keeps UI snappy)
  // NOTE: status=all => active only (matches what you already had)
  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (status === "completed") return r.isCompleted;
      if (status === "overdue") return !r.isCompleted && r.status === "overdue";
      if (status === "upcoming") return !r.isCompleted && (r.status === "due-soon" || r.status === "upcoming");
      return !r.isCompleted; // all => active only
    });
  }, [reminders, status]);

  const empty = filtered.length === 0;

  return (
    <div className="w-full space-y-6">
      {/* ✅ Summary toggle stays */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStatsOpen((p) => !p)}
          className="inline-flex items-center gap-2 text-left lg:cursor-default"
        >
          <span className="text-sm font-semibold text-white/85">Summary</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform lg:hidden ${statsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <span className={`text-xs ${textMeta}`}>
          {activeCount} active • {completedCount} completed
        </span>
      </div>

      {/* ✅ tiles hidden on mobile unless expanded, always visible on lg */}
      <section className={`${statsOpen ? "grid" : "hidden"} grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4`}>
        <div className={tileSurface}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Overdue</div>
          <div className={`mt-1 text-lg font-semibold ${overdueCount > 0 ? "text-red-300" : "text-white"}`}>
            {overdueCount}
          </div>
        </div>

        <div className={tileSurface}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Next 7 Days</div>
          <div className={`mt-1 text-lg font-semibold ${next7DaysCount > 0 ? "text-yellow-300" : "text-white"}`}>
            {next7DaysCount}
          </div>
        </div>

        <div className={tileSurface}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Upcoming</div>
          <div className="mt-1 text-lg font-semibold text-white">{Math.max(0, upcomingCount - next7DaysCount)}</div>
        </div>

        <div className={tileSurface}>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-white/45">Completed</div>
          <div className="mt-1 text-lg font-semibold text-white">{completedCount}</div>
        </div>
      </section>

      {/* ✅ Old filters back: always visible, no extra “Filters (Custom)” row */}
      <section className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className={formLabelCaps}>Search</label>
          <div className={formFieldShell}>
            <input
              className={formInputInner}
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
          <label className={formLabelCaps}>Status</label>
          <div className={`${formFieldShell} relative`}>
            <select
              className={formSelectInner}
              value={status}
              onChange={(e) => {
                const v = e.target.value;
                setStatus(v);
                updateFilters({ status: v });
              }}
            >
              <option value="all">Active ({activeCount})</option>
              <option value="overdue">Overdue ({overdueCount})</option>
              <option value="upcoming">Upcoming ({upcomingCount})</option>
              <option value="completed">Completed ({completedCount})</option>
            </select>
            <Chevron />
          </div>
        </div>

        <div>
          <label className={formLabelCaps}>Sort</label>
          <div className={`${formFieldShell} relative`}>
            <select
              className={formSelectInner}
              value={sort}
              onChange={(e) => {
                const v = e.target.value;
                setSort(v);
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
      </section>

      {/* List */}
      {empty ? (
        <div className="w-full rounded-2xl bg-black/20 p-10 text-center backdrop-blur">
          <p className="mb-2 text-white/80">No reminders match your view.</p>
          <p className={`text-sm ${textMeta}`}>Try a different status or search.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <ReminderRow key={r.id} reminder={r} homeId={homeId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReminderRow({ reminder, homeId }: { reminder: ReminderItem; homeId: string }) {
  const router = useRouter();
  const { push: toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast("Reminder deleted.");
      router.refresh();
    } catch {
      toast("Failed to delete reminder.");
      setDeleting(false);
    }
  }

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

  const badge = reminder.isCompleted
    ? { label: "Completed", cls: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" }
    : reminder.isOverdue
    ? { label: "Overdue", cls: "border-red-400/25 bg-red-400/10 text-red-200" }
    : reminder.isDueSoon
    ? { label: "Due soon", cls: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200" }
    : null;

  return (
    <>
      <div className={rowSurface}>
        <div className="flex items-start justify-between gap-4">
          <Link href={`/home/${homeId}/reminders/${reminder.id}`} className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-[15px] font-semibold text-white sm:text-base">{reminder.title}</h3>
              {badge ? (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${badge.cls}`}>
                  {badge.label}
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
              <span>📅 {reminder.formattedDate}</span>
              {reminder.attachments?.length ? <span>📎 {reminder.attachments.length}</span> : null}
            </div>
          </Link>

          <div className="flex shrink-0 items-center gap-2">
            {!reminder.isCompleted ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  void handleComplete();
                }}
                disabled={completing || deleting}
                className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-60"
              >
                {completing ? "…" : "Complete"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditOpen(true);
              }}
              disabled={deleting}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10 disabled:opacity-60"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                void handleDelete();
              }}
              disabled={deleting}
              className="rounded-full border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-400/15 disabled:opacity-60"
            >
              {deleting ? "…" : "Delete"}
            </button>
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