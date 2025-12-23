"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { EditReminderModal, type ReminderData } from "../_components/EditReminderModal";

type Props = {
  reminderId: string;
  homeId: string;
  reminder: ReminderData;
};

export function ReminderActions({ reminderId, homeId, reminder }: Props) {
  const router = useRouter();

  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminderId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete reminder");

      router.push(`/home/${homeId}/reminders`);
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete reminder. Please try again.");
      setDeleting(false);
      setConfirming(false);
    }
  }

  async function handleComplete() {
    if (completing) return;
    setCompleting(true);

    try {
      const res = await fetch(`/api/home/${homeId}/reminders/${reminderId}/complete`, { method: "PATCH" });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to mark complete");
      }

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
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            void handleComplete();
          }}
          disabled={completing || deleting}
          className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/15 disabled:opacity-60"
        >
          {completing ? "Marking…" : "Mark complete"}
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setEditOpen(true);
          }}
          disabled={deleting || completing}
          className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10 disabled:opacity-60"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();

            if (confirming) void handleDelete();
            else {
              setConfirming(true);
              setTimeout(() => setConfirming(false), 3000);
            }
          }}
          disabled={deleting || completing}
          className={[
            "rounded-full border px-4 py-2 text-sm transition-colors disabled:opacity-50",
            confirming
              ? "border-red-400/35 bg-red-400/15 text-red-100 hover:bg-red-400/20"
              : "border-red-400/25 bg-red-400/10 text-red-200 hover:bg-red-400/15",
          ].join(" ")}
        >
          {deleting ? "Deleting…" : confirming ? "Confirm delete?" : "Delete"}
        </button>
      </div>

      <EditReminderModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        reminder={reminder}
        homeId={homeId}
      />
    </>
  );
}