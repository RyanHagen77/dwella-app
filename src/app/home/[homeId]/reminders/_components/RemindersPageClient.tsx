"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { glass, ctaGhost } from "@/lib/glass";
import { Input, Select } from "@/components/ui";
import { EditReminderModal } from "./EditReminderModal";

type ReminderItem = {
  id: string;
  title: string;
  dueAt: string;
  note: string | null;
  status: "overdue" | "due-soon" | "upcoming";
  attachments: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
};

type Props = {
  reminders: ReminderItem[];
  homeId: string;
  initialStatus?: string;
  initialSearch?: string;
  initialSort?: string;
  overdueCount: number;
  upcomingCount: number;
};

export function RemindersPageClient({
  reminders,
  homeId,
  initialStatus,
  initialSearch,
  initialSort,
  overdueCount,
  upcomingCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(initialSearch || "");
  const [status, setStatus] = useState(initialStatus || "all");
  const [sort, setSort] = useState(initialSort || "soonest");

  function updateFilters(updates: { search?: string; status?: string; sort?: string }) {
    const params = new URLSearchParams(searchParams?.toString());

    if (updates.search !== undefined) {
      if (updates.search) {
        params.set("search", updates.search);
      } else {
        params.delete("search");
      }
    }

    if (updates.status !== undefined) {
      if (updates.status && updates.status !== "all") {
        params.set("status", updates.status);
      } else {
        params.delete("status");
      }
    }

    if (updates.sort !== undefined) {
      if (updates.sort && updates.sort !== "soonest") {
        params.set("sort", updates.sort);
      } else {
        params.delete("sort");
      }
    }

    const queryString = params.toString();
    router.push(`/home/${homeId}/reminders${queryString ? `?${queryString}` : ""}`);
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    const timeoutId = setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  }

  function handleStatusChange(value: string) {
    setStatus(value);
    updateFilters({ status: value });
  }

  function handleSortChange(value: string) {
    setSort(value);
    updateFilters({ sort: value });
  }

  return (
    <>
      {/* Filters */}
      <section className={glass}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search reminders..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Status</label>
            <Select value={status} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="all">All ({reminders.length})</option>
              <option value="overdue">Overdue ({overdueCount})</option>
              <option value="upcoming">Upcoming ({upcomingCount})</option>
            </Select>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm text-white/70 mb-2">Sort By</label>
            <Select value={sort} onChange={(e) => handleSortChange(e.target.value)}>
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
            <p className="text-white/70 mb-4">
              {search || status !== "all"
                ? "No reminders match your filters"
                : "No reminders yet"}
            </p>
            <Link href={`/home/${homeId}`} className={ctaGhost}>
              {search || status !== "all" ? "Clear Filters" : "+ Add Your First Reminder"}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <ReminderCard key={reminder.id} reminder={reminder} homeId={homeId} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ReminderCard({ reminder, homeId }: { reminder: ReminderItem; homeId: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const dueDate = new Date(reminder.dueAt);
  const now = new Date();
  const isOverdue = reminder.status === "overdue";
  const isDueSoon = reminder.status === "due-soon";
  const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminder.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete reminder");
      }

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
      <div
        className={`block p-4 rounded-lg transition-colors border ${
          isOverdue 
            ? "border-red-400/30 bg-red-500/5" 
            : isDueSoon 
            ? "border-yellow-400/30 bg-yellow-500/5" 
            : "border-white/10 bg-white/5"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title */}
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white text-lg flex-1">{reminder.title}</h3>
            </div>

            {/* Date Info */}
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${isOverdue ? "text-red-400" : "text-white/90"}`}>
                📅 {dueDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className={`text-sm ${isDueSoon ? "text-yellow-400" : isOverdue ? "text-red-400" : "text-white/60"}`}>
                {isOverdue ? (
                  Math.abs(daysUntilDue) === 1 ? "1 day overdue" : `${Math.abs(daysUntilDue)} days overdue`
                ) : daysUntilDue === 0 ? (
                  "Due today"
                ) : daysUntilDue === 1 ? (
                  "Due tomorrow"
                ) : (
                  `${daysUntilDue} days away`
                )}
              </span>
            </div>

            {/* Note */}
            {reminder.note && (
              <p className="text-sm text-white/70 line-clamp-1">{reminder.note}</p>
            )}

            {/* Attachments */}
            {reminder.attachments && reminder.attachments.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/60">
                <span>📎</span>
                <span>{reminder.attachments.length} attachment{reminder.attachments.length > 1 ? 's' : ''}</span>
                {reminder.attachments.slice(0, 3).map((att) => (
                  <button
                    key={att.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(`/api/home/${homeId}/attachments/${att.id}`, '_blank');
                    }}
                    className="hover:text-white/90 underline"
                  >
                    {att.filename.length > 15 ? att.filename.slice(0, 12) + '...' : att.filename}
                  </button>
                ))}
                {reminder.attachments.length > 3 && (
                  <span>+{reminder.attachments.length - 3} more</span>
                )}
              </div>
            )}
          </div>

          {/* Actions and Badge */}
          <div className="flex-shrink-0 flex items-center gap-2">
            {isOverdue && (
              <span className="inline-flex items-center px-2 py-1.5 rounded text-xs font-medium bg-red-400/20 text-red-300 border border-red-400/30">
                Overdue
              </span>
            )}
            {isDueSoon && (
              <span className="inline-flex items-center px-2 py-1.5 rounded text-xs font-medium bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                Due Soon
              </span>
            )}
            <button
              onClick={() => setEditOpen(true)}
              className="px-3 py-1.5 text-sm rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors text-white"
            >
              Edit
            </button>

            <button
              onClick={() => {
                if (showConfirm) {
                  handleDelete();
                } else {
                  setShowConfirm(true);
                  // Reset after 3 seconds if not clicked
                  setTimeout(() => setShowConfirm(false), 3000);
                }
              }}
              disabled={deleting}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                showConfirm
                  ? "border-red-400/50 bg-red-500/30 text-red-200 hover:bg-red-500/40"
                  : "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              } disabled:opacity-50`}
            >
              {deleting ? "Deleting..." : showConfirm ? "Confirm Delete?" : "Delete"}
            </button>
          </div>
        </div>
      </div>

      <EditReminderModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        reminder={{
          ...reminder,
          dueAt: new Date(reminder.dueAt)
        }}
        homeId={homeId}
      />
    </>
  );
}