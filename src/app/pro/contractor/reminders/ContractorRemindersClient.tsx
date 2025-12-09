// app/pro/contractor/reminders/ContractorRemindersClient.tsx
"use client";

import { useMemo, useState } from "react";
import { ctaPrimary, ctaGhost, textMeta } from "@/lib/glass";
import ContractorReminderModal from "./ContractorReminderModal";

type ContractorReminderStatus = "PENDING" | "DONE";

export type ContractorReminderDTO = {
  id: string;
  title: string;
  note: string | null;
  status: ContractorReminderStatus;
  dueAt: string | null; // ISO string
  createdAt: string;
};

type Props = {
  initialReminders: ContractorReminderDTO[];
};

function formatDate(dateIso: string | null): string {
  if (!dateIso) return "No due date";
  const d = new Date(dateIso);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(r: ContractorReminderDTO) {
  if (!r.dueAt || r.status === "DONE") return false;
  const now = new Date();
  const due = new Date(r.dueAt);
  return due.getTime() < now.getTime();
}

export default function ContractorRemindersClient({ initialReminders }: Props) {
  const [reminders, setReminders] = useState<ContractorReminderDTO[]>(initialReminders);
  const [filter, setFilter] = useState<"all" | "pending" | "done">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ContractorReminderDTO | null>(
    null
  );

  const filtered = useMemo(() => {
    return reminders.filter((r) => {
      if (filter === "pending") return r.status === "PENDING";
      if (filter === "done") return r.status === "DONE";
      return true;
    });
  }, [reminders, filter]);

  const handleAddClick = () => {
    setEditingReminder(null);
    setModalOpen(true);
  };

  const handleEditClick = (reminder: ContractorReminderDTO) => {
    setEditingReminder(reminder);
    setModalOpen(true);
  };

  const handleSave = (saved: ContractorReminderDTO) => {
    setReminders((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === saved.id);
      if (existingIdx === -1) {
        return [saved, ...prev];
      }
      const copy = [...prev];
      copy[existingIdx] = saved;
      return copy;
    });
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 text-xs sm:text-sm">
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 ${
              filter === "all"
                ? "bg-white/10 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 ${
              filter === "pending"
                ? "bg-white/10 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>
          <button
            type="button"
            className={`rounded-full px-3 py-1.5 ${
              filter === "done"
                ? "bg-white/10 text-white"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setFilter("done")}
          >
            Completed
          </button>
        </div>

        <button
          type="button"
          className={ctaPrimary + " inline-flex items-center justify-center px-4 py-2"}
          onClick={handleAddClick}
        >
          + Add Reminder
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-black/20 px-4 py-6 text-center text-sm text-white/70">
          No reminders yet. Create your first follow-up to keep tabs on clients and jobs.
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-white/5">
          {filtered.map((r) => {
            const overdue = isOverdue(r);
            return (
              <li
                key={r.id}
                className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{r.title}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${
                        r.status === "DONE"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : overdue
                          ? "bg-red-500/10 text-red-300"
                          : "bg-amber-500/10 text-amber-200"
                      }`}
                    >
                      {r.status === "DONE"
                        ? "Done"
                        : overdue
                        ? "Overdue"
                        : "Pending"}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Due {formatDate(r.dueAt)}
                  </div>
                  {r.note && (
                    <p className={textMeta + " mt-1 line-clamp-2 text-xs text-white/70"}>
                      {r.note}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex items-center gap-2 sm:mt-0">
                  <button
                    type="button"
                    className={
                      ctaGhost +
                      " inline-flex items-center justify-center px-3 py-1.5 text-xs"
                    }
                    onClick={() => handleEditClick(r)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs text-red-200 hover:bg-red-500/20"
                    onClick={async () => {
                      const confirmed = window.confirm(
                        "Delete this reminder? This cannot be undone."
                      );
                      if (!confirmed) return;
                      const res = await fetch(
                        `/api/pro/contractor/reminders/${r.id}`,
                        { method: "DELETE" }
                      );
                      if (!res.ok) {
                        // You can replace with your toast system
                        alert("Failed to delete reminder.");
                        return;
                      }
                      handleDelete(r.id);
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modalOpen && (
        <ContractorReminderModal
          reminder={editingReminder}
          onClose={() => setModalOpen(false)}
          onSaved={handleSave}
        />
      )}
    </div>
  );
}