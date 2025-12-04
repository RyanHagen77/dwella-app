"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { EditReminderModal } from "../_components/EditReminderModal";

type ReminderData = {
  id: string;
  title: string;
  dueAt: Date;
  note: string | null;
};

type Props = {
  reminderId: string;
  homeId: string;
  reminder: ReminderData;
};

export function ReminderActions({ reminderId, homeId, reminder }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete reminder");
      }

      router.push(`/home/${homeId}/reminders`);
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete reminder. Please try again.");
      setDeleting(false);
      setShowConfirmDelete(false);
    }
  }

  async function handleComplete() {
    if (completing) return;
    setCompleting(true);
    try {
      const res = await fetch(
        `/api/home/${homeId}/reminders/${reminderId}/complete`,
        { method: "PATCH" }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to mark complete");
      }

      // Back to list — completed reminder will be treated as archived
      router.push(`/home/${homeId}/reminders`);
      router.refresh();
    } catch (error) {
      console.error("Complete failed:", error);
      alert("Failed to mark as complete. Please try again.");
      setCompleting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {/* Mark complete */}
        <button
          type="button"
          onClick={handleComplete}
          disabled={completing || deleting}
          className="rounded-lg border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
        >
          {completing ? "Marking…" : "Mark complete"}
        </button>

        {/* Edit */}
        <button
          type="button"
          className={ctaGhost}
          onClick={() => setEditOpen(true)}
          disabled={completing || deleting}
        >
          Edit
        </button>

        {/* Delete with confirm step */}
        {showConfirmDelete ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConfirmDelete(false)}
              className="px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 text-sm rounded-lg border border-red-400/30 bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowConfirmDelete(true)}
            disabled={completing}
            className="px-3 py-2 text-sm rounded-lg border border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <EditReminderModal
        open={editOpen}
        onCloseAction={() => setEditOpen(false)}
        reminder={reminder}
        homeId={homeId}
      />
    </>
  );
}