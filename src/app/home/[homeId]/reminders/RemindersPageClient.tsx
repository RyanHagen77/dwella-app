"use client";

import { useState } from "react";
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
  overdueCount: number;
  upcomingCount: number;
  completedCount: number;
  activeCount: number;
};

const filterSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";
const cardSurface = "rounded-2xl border border-white/12 bg-black/25 p-5";

export function RemindersPageClient({
  reminders,
  homeId,
  initialStatus,
  initialSearch,
  initialSort,
  overdueCount,
  upcomingCount,
  completedCount,
  activeCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState(initialStatus || "all");
  const [sort, setSort] = useState(initialSort || "soonest");

  const hasActiveFilters = Boolean(search.trim()) || status !== "all" || sort !== "soonest";

  function updateFilters(updates: { search?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
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

  function handleClearFilters() {
    setSearch("");
    setStatus("all");
    setSort("soonest");
    router.push(`/home/${homeId}/reminders`);
  }

  // Client-side status view (keeps UI snappy)
  const filteredReminders = reminders.filter((r) => {
    if (status === "overdue") return !r.isCompleted && r.status === "overdue";
    if (status === "upcoming") return !r.isCompleted && (r.status === "due-soon" || r.status === "upcoming");
    if (status === "completed") return r.isCompleted;
    // "all" = active only
    return !r.isCompleted;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className={filterSurface}>
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
        </div>
      </section>

      {/* List */}
      {filteredReminders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <p className="mb-2 text-white/80">
            {hasActiveFilters ? "No reminders match your filters." : "No reminders yet for this home."}
          </p>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              Clear filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => (
            <ReminderCard key={reminder.id} reminder={reminder} homeId={homeId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReminderCard({ reminder, homeId }: { reminder: ReminderItem; homeId: string }) {
  const router = useRouter();
  const { push: toast } = useToast();

  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);

  const dueDate = new Date(reminder.dueAt);
  const now = new Date();
  const isCompleted = reminder.isCompleted;
  const isOverdue = reminder.status === "overdue";
  const isDueSoon = reminder.status === "due-soon";

  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reminder");
      toast("Reminder deleted.");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      toast("Failed to delete reminder. Please try again.");
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  async function handleComplete() {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}/complete`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to mark complete");
      }
      toast("Marked complete.");
      router.refresh();
    } catch (error) {
      console.error("Complete failed:", error);
      toast("Failed to mark as complete. Please try again.");
      setCompleting(false);
    }
  }

  return (
    <>
      <Link href={`/home/${homeId}/reminders/${reminder.id}`} className={`${cardSurface} block transition-colors hover:bg-black/30`}>
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-white sm:text-lg">{reminder.title}</h3>

              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
                <span className={isOverdue && !isCompleted ? "text-red-300" : ""}>
                  📅{" "}
                  {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>

                {!isCompleted ? (
                  <span
                    className={[
                      "text-sm",
                      isDueSoon ? "text-yellow-300" : isOverdue ? "text-red-300" : "text-white/60",
                    ].join(" ")}
                  >
                    {isOverdue
                      ? Math.abs(daysUntilDue) === 1
                        ? "1 day overdue"
                        : `${Math.abs(daysUntilDue)} days overdue`
                      : daysUntilDue === 0
                      ? "Due today"
                      : daysUntilDue === 1
                      ? "Due tomorrow"
                      : `${daysUntilDue} days away`}
                  </span>
                ) : (
                  <span className="text-emerald-300">Completed</span>
                )}
              </div>

              {reminder.note ? <p className={`mt-2 line-clamp-2 text-sm ${textMeta}`}>{reminder.note}</p> : null}

              {reminder.attachments?.length ? (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span>📎</span>
                  <span>
                    {reminder.attachments.length} attachment{reminder.attachments.length > 1 ? "s" : ""}
                  </span>

                  {reminder.attachments.slice(0, 3).map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(`/api/home/${homeId}/attachments/${att.id}`, "_blank");
                      }}
                      className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-xs text-white/75 hover:bg-black/25 hover:text-white"
                      title={att.filename}
                    >
                      {att.filename.length > 18 ? att.filename.slice(0, 15) + "…" : att.filename}
                    </button>
                  ))}
                  {reminder.attachments.length > 3 ? <span>+{reminder.attachments.length - 3} more</span> : null}
                </div>
              ) : null}
            </div>

            {/* Badges */}
            <div className="shrink-0">
              {!isCompleted && isOverdue ? (
                <span className="inline-flex items-center rounded-full border border-red-400/30 bg-red-400/10 px-3 py-1 text-xs font-semibold text-red-200">
                  Overdue
                </span>
              ) : !isCompleted && isDueSoon ? (
                <span className="inline-flex items-center rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                  Due soon
                </span>
              ) : isCompleted ? (
                <span className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Completed
                </span>
              ) : null}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-white/50">
              {reminder.status === "due-soon" ? "Due soon" : reminder.status === "upcoming" ? "Upcoming" : ""}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isCompleted ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    void handleComplete();
                  }}
                  disabled={completing || deleting}
                  className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/15 disabled:opacity-60"
                >
                  {completing ? "Marking…" : "Mark complete"}
                </button>
              ) : null}

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditOpen(true);
                }}
                className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
              >
                Edit
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (showConfirm) void handleDelete();
                  else {
                    setShowConfirm(true);
                    setTimeout(() => setShowConfirm(false), 3000);
                  }
                }}
                disabled={deleting}
                className={[
                  "rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-50",
                  showConfirm
                    ? "border-red-400/35 bg-red-400/15 text-red-100 hover:bg-red-400/20"
                    : "border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/15",
                ].join(" ")}
              >
                {deleting ? "Deleting…" : showConfirm ? "Confirm delete?" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </Link>

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