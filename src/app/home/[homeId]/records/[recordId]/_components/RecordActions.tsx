// app/stats/[homeId]/records/[recordId]/_components/RecordActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { EditRecordModal } from "./EditRecordModal";

type RecordData = {
  id: string;
  title: string;
  date: Date | null;
  kind: string | null;
  vendor: string | null;
  cost: number | null;
  note: string | null;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
};

type Props = {
  recordId: string;
  homeId: string;
  record: RecordData;
};

export function RecordActions({ recordId, homeId, record }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/home/${homeId}/records/${recordId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete record");
      }

      // Redirect back to records list
      router.push(`/home/${homeId}/records`);
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete record. Please try again.");
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
          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
            showConfirm
              ? "border-red-400/50 bg-red-500/30 text-red-200 hover:bg-red-500/40"
              : "border-red-400/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          } disabled:opacity-50`}
        >
          {deleting ? "Deleting..." : showConfirm ? "Confirm Delete?" : "Delete"}
        </button>
      </div>

      <EditRecordModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        record={record}
        homeId={homeId}
      />
    </>
  );
}