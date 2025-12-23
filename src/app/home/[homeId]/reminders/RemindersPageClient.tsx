"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { heading, textMeta, ctaPrimary } from "@/lib/glass";
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

  // summary counts
  overdueCount: number;
  upcomingCount: number;
  next7DaysCount: number;
  completedCount: number;
  activeCount: number;
  totalVisible: number;
};

const rowSurface =
  "rounded-2xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur transition hover:bg-black/25";

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
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState(initialStatus || "active");
  const [sort, setSort] = useState(initialSort || "soonest");

  // ✅ Summary drawer (same pattern as PropertyStats)
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  function updateFilters(updates: { search?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      const v = updates.search;
      if (v) params.set("search", v);
      else params.delete("search");
    }

    if (updates.status !== undefined) {
      const v = updates.status;
      if (v && v !== "active") params.set("status", v);
      else params.delete("status"); // active is default
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
    return reminders.filter((r) => {
      if (status === "completed") return r.isCompleted;
      if (status === "overdue") return !r.isCompleted && r.status === "overdue";
      if (status === "upcoming") return !r.isCompleted && (r.status === "due-soon" || r.status === "upcoming");
      // "active" (default) => not completed
      return !r.isCompleted;
    });
  }, [reminders, status]);

  return (
    <div className="space-y-6">
      {/* ✅ Mobile add button (guaranteed visible) */}
      <div className="sm:hidden">
        <Link
          href={`/home/${homeId}?add=reminder`}
          className={`${ctaPrimary} inline-flex text-sm`}
        >
          + Add Reminder
        </Link>
      </div>

      {/* ✅ Summary (collapsible on mobile; always open on desktop) */}
      <section aria-labelledby="summary" className="space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSummaryExpanded((p) => !p)}
            className="inline-flex items-center gap-2 text-left lg:cursor-default"
          >
            <h2 id="summary" className={`text-lg font-semibold ${heading}`}>
              Summary
            </h2>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform lg:hidden ${summaryExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <span className={`text-sm ${textMeta}`}>
            {activeCount} active • {completedCount} completed
          </span>
        </div>

        <div
          className={[
            summaryExpanded ? "grid" : "hidden",
            "grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4",
          ].join(" ")}
        >
          <StatTile label="Overdue" value={overdueCount} highlight={overdueCount > 0 ? "red" : undefined} />
          <StatTile label="Next 7 Days" value={next7DaysCount} highlight={next7DaysCount > 0 ? "yellow" : undefined} />
          <StatTile label="Upcoming" value={upcomingCount} />
          <StatTile label="Completed" value={completedCount} />
        </div>
      </section>

      {/* ✅ Filters (your original 3-field row) */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                <option value="active">Active ({activeCount})</option>
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
        </div>
      </section>

      {/* List */}
      {filteredReminders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
          <p className="mb-2 text-white/80">No reminders match your selection.</p>
          <p className={`text-sm ${textMeta}`}>Try a different status or search term.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((rem) => (
            <ReminderRow key={rem.id} reminder={rem} homeId={homeId} />
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
  const [showDetails, setShowDetails] = useState(false); // ✅ mobile details toggle
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const badge = isCompleted
    ? "Completed"
    : isOverdue
    ? "Overdue"
    : isDueSoon
    ? "Due soon"
    : "";

  return (
    <>
      <div className={rowSurface}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/home/${homeId}/reminders/${reminder.id}`}
              className="block min-w-0"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white sm:text-lg">
                  {reminder.title}
                </h3>

                {badge ? (
                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                      isCompleted
                        ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                        : isOverdue
                        ? "border-red-400/30 bg-red-400/10 text-red-200"
                        : "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
                    ].join(" ")}
                  >
                    {badge}
                  </span>
                ) : null}
              </div>

              <div className={`mt-1 text-sm ${textMeta}`}>
                📅 {reminder.formattedDate}
                {!isCompleted ? (
                  <>
                    {" "}
                    •{" "}
                    {isOverdue
                      ? `${Math.abs(reminder.daysUntil)} day${Math.abs(reminder.daysUntil) === 1 ? "" : "s"} overdue`
                      : reminder.daysUntil === 0
                      ? "Due today"
                      : reminder.daysUntil === 1
                      ? "Due tomorrow"
                      : `${reminder.daysUntil} days away`}
                  </>
                ) : null}
                {reminder.attachments?.length ? ` • 📎 ${reminder.attachments.length}` : ""}
              </div>
            </Link>

            {/* ✅ Mobile: Details toggle controls notes/attachments/actions without “card chaos” */}
            <div className="mt-3 flex items-center gap-2 sm:hidden">
              <button
                type="button"
                onClick={() => setShowDetails((p) => !p)}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10"
              >
                {showDetails ? "Hide details" : "Details"}
              </button>

              {!isCompleted ? (
                <button
                  type="button"
                  onClick={() => void handleComplete()}
                  disabled={completing || deleting}
                  className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-60"
                >
                  {completing ? "Marking…" : "Mark complete"}
                </button>
              ) : null}
            </div>

            {showDetails ? (
              <div className="mt-4 space-y-3 sm:hidden">
                {reminder.note ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                    <div className={`mb-1 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Notes</div>
                    <p className="whitespace-pre-wrap text-sm text-white/85">{reminder.note}</p>
                  </div>
                ) : null}

                {reminder.attachments?.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {reminder.attachments.slice(0, 6).map((att) => (
                      <button
                        key={att.id}
                        type="button"
                        onClick={() => window.open(`/api/home/${homeId}/attachments/${att.id}`, "_blank")}
                        className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-white/75 hover:bg-black/25 hover:text-white"
                        title={att.filename}
                      >
                        {att.filename.length > 18 ? att.filename.slice(0, 15) + "…" : att.filename}
                      </button>
                    ))}
                    {reminder.attachments.length > 6 ? (
                      <span className="text-xs text-white/60">+{reminder.attachments.length - 6} more</span>
                    ) : null}
                  </div>
                ) : null}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditOpen(true)}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirmDelete) void handleDelete();
                      else {
                        setConfirmDelete(true);
                        window.setTimeout(() => setConfirmDelete(false), 2500);
                      }
                    }}
                    disabled={deleting}
                    className={[
                      "rounded-full border px-4 py-2 text-sm transition disabled:opacity-50",
                      confirmDelete
                        ? "border-red-400/35 bg-red-400/15 text-red-100 hover:bg-red-400/20"
                        : "border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/15",
                    ].join(" ")}
                  >
                    {deleting ? "Deleting…" : confirmDelete ? "Confirm?" : "Delete"}
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {/* ✅ Desktop actions live on the right (no weird nested borders) */}
          <div className="hidden shrink-0 items-start gap-2 sm:flex">
            {!isCompleted ? (
              <button
                type="button"
                onClick={() => void handleComplete()}
                disabled={completing || deleting}
                className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-60"
              >
                {completing ? "Marking…" : "Mark complete"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirmDelete) void handleDelete();
                else {
                  setConfirmDelete(true);
                  window.setTimeout(() => setConfirmDelete(false), 2500);
                }
              }}
              disabled={deleting}
              className={[
                "rounded-full border px-4 py-2 text-sm transition disabled:opacity-50",
                confirmDelete
                  ? "border-red-400/35 bg-red-400/15 text-red-100 hover:bg-red-400/20"
                  : "border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/15",
              ].join(" ")}
            >
              {deleting ? "Deleting…" : confirmDelete ? "Confirm?" : "Delete"}
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

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: "red" | "yellow";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
      <div className={`text-xs font-semibold uppercase tracking-wide ${textMeta}`}>{label}</div>
      <div
        className={[
          "mt-2 text-lg font-bold",
          highlight === "red"
            ? "text-red-300"
            : highlight === "yellow"
            ? "text-yellow-300"
            : "text-white",
        ].join(" ")}
      >
        {value}
      </div>
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