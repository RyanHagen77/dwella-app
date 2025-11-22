"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { glass, ctaGhost } from "@/lib/glass";
import { Input, Select } from "@/components/ui";
import { EditReminderModal } from "./EditReminderModal";

export type ReminderItem = {
  id: string;
  title: string;
  dueAt: string;
  note: string | null;
  formattedDate: string;
  status: "overdue" | "due-soon" | "upcoming";
  isOverdue: boolean;
  isDueSoon: boolean;
  daysUntil: number;
  attachments: {
    id: string;
    filename: string;
    url: string;
    mimeType: string;
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
  /** Optional UI callback (client-only). If passed from server it must be a Server Action. */
  onAddReminderAction?: () => void;
};

export function RemindersPageClient({
  reminders,
  homeId,
  initialStatus,
  initialSearch,
  initialSort,
  overdueCount,
  upcomingCount,
  onAddReminderAction,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState(initialStatus || "all");
  const [sort, setSort] = useState(initialSort || "soonest");

  const hasActiveFilters =
    Boolean(search.trim()) || status !== "all" || sort !== "soonest";

  function updateFilters(updates: {
    search?: string;
    status?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      if (updates.search) params.set("search", updates.search);
      else params.delete("search");
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all")
        params.set("status", updates.status);
      else params.delete("status");
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "soonest")
        params.set("sort", updates.sort);
      else params.delete("sort");
    }

    const queryString = params.toString();
    router.push(
      `/home/${homeId}/reminders${queryString ? `?${queryString}` : ""}`
    );
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    updateFilters({ search: value });
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    updateFilters({ status: value });
  }

  function handleSortChange(value: string) {
    setSort(value);
    updateFilters({ sort: value });
  }

  function handleClearFilters() {
    setSearch("");
    setStatus("all");
    setSort("soonest");
    router.push(`/home/${homeId}/reminders`);
  }

  return (
    <>
      {/* Filters */}
      <section className={glass}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}
          <div>
            <label className="mb-2 block text-sm text-white/70">Search</label>
            <Input
              type="text"
              placeholder="Search reminders..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="mb-2 block text-sm text-white/70">Status</label>
            <Select
              value={status}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="all">All ({reminders.length})</option>
              <option value="overdue">Overdue ({overdueCount})</option>
              <option value="upcoming">Upcoming ({upcomingCount})</option>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="mb-2 block text-sm text-white/70">Sort By</label>
            <Select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="soonest">Soonest First</option>
              <option value="latest">Latest First</option>
              <option value="title">Title (A-Z)</option>
            </Select>
          </div>
        </div>
      </section>

      {/* Reminders List */}
      <section className={glass}>
        {reminders.length === 0 ? (
          <div className="py-16 text-center">
            <p className="mb-4 text-white/70">
              {hasActiveFilters
                ? "No reminders match your filters."
                : "No reminders yet for this home."}
            </p>

            {hasActiveFilters ? (
              <button
                type="button"
                onClick={handleClearFilters}
                className={ctaGhost}
              >
                Clear filters
              </button>
            ) : onAddReminderAction ? (
              <button
                type="button"
                onClick={onAddReminderAction}
                className={ctaGhost}
              >
                + Add your first reminder
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                homeId={homeId}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ReminderCard({
  reminder,
  homeId,
}: {
  reminder: ReminderItem;
  homeId: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const dueDate = new Date(reminder.dueAt);
  const now = new Date();
  const isOverdue = reminder.status === "overdue";
  const isDueSoon = reminder.status === "due-soon";
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/home/${homeId}/reminders/${reminder.id}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to delete reminder");

      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete reminder. Please try again.");
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  return (
    <>
      <Link
        href={`/home/${homeId}/reminders/${reminder.id}`}
        className={`block rounded-lg border p-4 transition-colors ${
          isOverdue
            ? "border-red-400/30 bg-red-500/5 hover:bg-red-500/10"
            : isDueSoon
            ? "border-yellow-400/30 bg-yellow-500/5 hover:bg-yellow-500/10"
            : "border-white/10 bg-white/5 hover:bg-white/10"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="flex-1 truncate text-lg font-medium text-white">
                {reminder.title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <span
                className={`text-sm font-medium ${
                  isOverdue ? "text-red-400" : "text-white/90"
                }`}
              >
                📅{" "}
                {dueDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>

              <span
                className={`text-sm ${
                  isDueSoon
                    ? "text-yellow-400"
                    : isOverdue
                    ? "text-red-400"
                    : "text-white/60"
                }`}
              >
                {isOverdue ? (
                  Math.abs(daysUntilDue) === 1
                    ? "1 day overdue"
                    : `${Math.abs(daysUntilDue)} days overdue`
                ) : daysUntilDue === 0 ? (
                  "Due today"
                ) : daysUntilDue === 1 ? (
                  "Due tomorrow"
                ) : (
                  `${daysUntilDue} days away`
                )}
              </span>
            </div>

            {reminder.note && (
              <p className="line-clamp-1 text-sm text-white/70">
                {reminder.note}
              </p>
            )}

            {reminder.attachments?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs text-white/60">
                <span>📎</span>
                <span>
                  {reminder.attachments.length} attachment
                  {reminder.attachments.length > 1 ? "s" : ""}
                </span>

                {reminder.attachments.slice(0, 3).map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(
                        `/api/home/${homeId}/attachments/${att.id}`,
                        "_blank"
                      );
                    }}
                    className="underline hover:text-white/90"
                  >
                    {att.filename.length > 15
                      ? att.filename.slice(0, 12) + "..."
                      : att.filename}
                  </button>
                ))}

                {reminder.attachments.length > 3 && (
                  <span>+{reminder.attachments.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-2">
            {isOverdue && (
              <span className="inline-flex items-center rounded border border-red-400/30 bg-red-400/20 px-2 py-1.5 text-xs font-medium text-red-300">
                Overdue
              </span>
            )}
            {isDueSoon && (
              <span className="inline-flex items-center rounded border border-yellow-400/30 bg-yellow-400/20 px-2 py-1.5 text-xs font-medium text-yellow-300">
                Due Soon
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setEditOpen(true);
              }}
              className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/15"
            >
              Edit
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();

                if (showConfirm) {
                  handleDelete();
                } else {
                  setShowConfirm(true);
                  setTimeout(() => setShowConfirm(false), 3000);
                }
              }}
              disabled={deleting}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                showConfirm
                  ? "border-red-400/50 bg-red-500/30 text-red-200 hover:bg-red-500/40"
                  : "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              } disabled:opacity-50`}
            >
              {deleting
                ? "Deleting..."
                : showConfirm
                ? "Confirm Delete?"
                : "Delete"}
            </button>
          </div>
        </div>
      </Link>

      <EditReminderModal
        open={editOpen}
        onCloseAction={() => setEditOpen(false)}
        reminder={{
          ...reminder,
          dueAt: new Date(reminder.dueAt),
        }}
        homeId={homeId}
      />
    </>
  );
}