"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

  const hasActiveFilters =
    Boolean(search.trim()) || status !== "all" || sort !== "soonest";

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

  function handleClearFilters() {
    setSearch("");
    setStatus("all");
    setSort("soonest");
    router.push(`/home/${homeId}/reminders`);
  }

  // Client-side status view
  const filteredReminders = reminders.filter((r) => {
    if (status === "overdue") return !r.isCompleted && r.status === "overdue";
    if (status === "upcoming")
      return !r.isCompleted && (r.status === "due-soon" || r.status === "upcoming");
    if (status === "completed") return r.isCompleted;
    return !r.isCompleted; // "all" = active only
  });

  return (
    <div className="w-full space-y-5">
      {/* Filters (inline) */}
      <div className="w-full">
        <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
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

        {hasActiveFilters ? (
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`text-xs ${textMeta}`}>Filters applied</span>
            <button
              type="button"
              onClick={handleClearFilters}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/85 transition hover:bg-white/10"
            >
              Clear filters
            </button>
          </div>
        ) : null}
      </div>

      {/* List */}
      {filteredReminders.length === 0 ? (
        <div className="w-full rounded-2xl border border-white/10 bg-black/20 p-10 text-center backdrop-blur">
          <p className="mb-2 text-white/80">
            {hasActiveFilters ? "No reminders match your filters." : "No reminders yet for this home."}
          </p>
          <p className={`text-sm ${textMeta}`}>
            {hasActiveFilters ? "Try adjusting status or search terms." : "Add one above to get started."}
          </p>
        </div>
      ) : (
        <div className="w-full space-y-3">
          {filteredReminders.map((reminder) => (
            <ReminderDrawerCard key={reminder.id} reminder={reminder} homeId={homeId} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReminderDrawerCard({ reminder, homeId }: { reminder: ReminderItem; homeId: string }) {
  const router = useRouter();
  const { push: toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const confirmTimerRef = useRef<number | null>(null);

  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    return () => {
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
    };
  }, []);

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

  const leftAccent = isCompleted
    ? "before:bg-emerald-400/60"
    : isOverdue
    ? "before:bg-red-400/70"
    : isDueSoon
    ? "before:bg-yellow-400/70"
    : "before:bg-white/12";

  const badge = !isCompleted && isOverdue
    ? { label: "Overdue", cls: "border-red-400/25 bg-red-400/10 text-red-200" }
    : !isCompleted && isDueSoon
    ? { label: "Due soon", cls: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200" }
    : isCompleted
    ? { label: "Completed", cls: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" }
    : null;

  return (
    <>
      <div
        className={[
          "group relative overflow-hidden rounded-2xl border border-white/10 bg-black/25 backdrop-blur transition",
          "hover:bg-black/30 hover:border-white/15",
          "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
          leftAccent,
        ].join(" ")}
      >
        {/* Summary row (drawer trigger) */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
          aria-expanded={open}
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/home/${homeId}/reminders/${reminder.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="min-w-0 truncate text-[15px] font-semibold text-white sm:text-lg hover:text-white/90"
                  >
                    {reminder.title}
                  </Link>

                  {badge ? (
                    <span
                      className={[
                        "shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                        badge.cls,
                      ].join(" ")}
                    >
                      {badge.label}
                    </span>
                  ) : null}
                </div>

                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/60">
                  <span className={isOverdue && !isCompleted ? "text-red-300" : ""}>
                    📅 {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>

                  {!isCompleted ? (
                    <span className={isDueSoon ? "text-yellow-300" : isOverdue ? "text-red-300" : "text-white/60"}>
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

                {reminder.note ? (
                  <p className={`mt-2 line-clamp-1 text-sm ${textMeta}`}>
                    {reminder.note}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-0.5 flex shrink-0 items-center gap-2 text-white/60">
            <span className="text-xs">{open ? "Hide" : "Details"}</span>
            <Caret open={open} />
          </div>
        </button>

        {/* Drawer content */}
        <div
          className={[
            "grid transition-[grid-template-rows,opacity] duration-200",
            open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
          ].join(" ")}
        >
          <div className="overflow-hidden">
            <div className="px-5 pb-5 pt-1">
              {reminder.attachments?.length ? (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-white/60">
                  <span>📎</span>
                  <span>
                    {reminder.attachments.length} attachment{reminder.attachments.length > 1 ? "s" : ""}
                  </span>

                  {reminder.attachments.slice(0, 4).map((att) => (
                    <button
                      key={att.id}
                      type="button"
                      onClick={() => window.open(`/api/home/${homeId}/attachments/${att.id}`, "_blank")}
                      className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/75 hover:bg-white/10 hover:text-white"
                      title={att.filename}
                    >
                      {att.filename.length > 18 ? att.filename.slice(0, 15) + "…" : att.filename}
                    </button>
                  ))}
                  {reminder.attachments.length > 4 ? <span>+{reminder.attachments.length - 4} more</span> : null}
                </div>
              ) : null}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
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
                  disabled={deleting}
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/90 transition hover:bg-white/10 disabled:opacity-60"
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!showConfirm) {
                      setShowConfirm(true);
                      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
                      confirmTimerRef.current = window.setTimeout(() => setShowConfirm(false), 2500);
                      return;
                    }
                    void handleDelete();
                  }}
                  disabled={deleting}
                  className={[
                    "rounded-full border px-4 py-2 text-sm transition disabled:opacity-50",
                    showConfirm
                      ? "border-red-400/35 bg-red-400/15 text-red-100 hover:bg-red-400/20"
                      : "border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/15",
                  ].join(" ")}
                >
                  {deleting ? "Deleting…" : showConfirm ? "Confirm?" : "Delete"}
                </button>
              </div>
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

function Caret({ open }: { open: boolean }) {
  return (
    <svg
      className={[
        "h-4 w-4 transition-transform duration-200",
        open ? "rotate-180" : "rotate-0",
      ].join(" ")}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
        clipRule="evenodd"
      />
    </svg>
  );
}