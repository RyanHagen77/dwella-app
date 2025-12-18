"use client";

import { useState } from "react";
import { EditStatsModal } from "./EditStatsModal";

type HomeStats = {
  healthScore: number | null;
  estValue: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
};

export function EditStatsButton({
  homeId,
  currentStats,
}: {
  homeId: string;
  currentStats: HomeStats;
}) {
  const [editStatsOpen, setEditStatsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setEditStatsOpen(true)}
        className="text-sm text-white/70 hover:text-white flex items-center gap-1 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Edit Stats
      </button>

    <EditStatsModal
      open={editStatsOpen}
      onCloseAction={() => setEditStatsOpen(false)}
      homeId={homeId}
      currentStats={currentStats}
    />
    </>
  );
}