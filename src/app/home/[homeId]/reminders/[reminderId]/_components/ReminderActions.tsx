"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { EditReminderModal } from "../../_components/EditReminderModal";

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
  const [showConfirm, setShowConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminderId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete reminder");
      }

      // Redirect back to reminders list
      router.push(`/home/${homeId}/reminders`);
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete reminder. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          className={ctaGhost}
          onClick={() => setEditOpen(true)}
        >
          Edit
        </button>

        {showConfirm ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-2 text-sm rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              disabled={deleting}
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3 py-2 text-sm rounded-lg border border-red-400/30 bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Confirm Delete"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowConfirm(true)}
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