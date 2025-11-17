"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ctaGhost } from "@/lib/glass";
import { EditWorkRecordModal } from "./EditWorkRecordModal";

type WorkRecordData = {
  id: string;
  workType: string;
  workDate: string;
  description: string;
  cost: number | null;
  status: string;
};

type Props = {
  workRecordId: string;
  workRecord: WorkRecordData;
};

export function WorkRecordActions({ workRecordId, workRecord }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pro/contractor/work-records/${workRecordId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete work record");
      }

      router.push("/pro/contractor/work-records");
      router.refresh();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete work record. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setEditOpen(true)}
          className={ctaGhost}
        >
          Edit
        </button>

        <button
          onClick={async () => {
            if (showConfirm) {
              await handleDelete(); // ✅ Add await
            } else {
              setShowConfirm(true);
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

      <EditWorkRecordModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        workRecord={workRecord}
        workRecordId={workRecordId}
      />
    </>
  );
}