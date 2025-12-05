"use client";

import { useState } from "react";
import { glass, heading, textMeta } from "@/lib/glass";
import { EditStatsButton } from "./EditStatsButton";

type HomeStats = {
  healthScore: number | null;
  estValue: number | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  yearBuilt: number | null;
};

export function PropertyStats({
  homeId,
  stats,
}: {
  homeId: string;
  stats: HomeStats;
}) {
  // collapsed by default only on mobile
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section aria-labelledby="stats" className="space-y-3">
      {/* Header with toggle + edit button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 text-left lg:cursor-default"
        >
          <h2
            id="stats"
            className={`text-lg font-semibold ${heading}`}
          >
            Property Stats
          </h2>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform lg:hidden ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <EditStatsButton homeId={homeId} currentStats={stats} />
      </div>

      {/* Stats grid - always visible on desktop (lg+), toggled on mobile */}
      <div
        className={`${
          isExpanded ? "grid" : "hidden"
        } grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4`}
      >
        <Stat
          label="Est. Value"
          value={
            stats.estValue != null
              ? `$${Number(stats.estValue).toLocaleString()}`
              : "—"
          }
        />
        <Stat
          label="Beds / Baths"
          value={`${stats.beds ?? "—"} / ${stats.baths ?? "—"}`}
        />
        <Stat
          label="Sq Ft"
          value={
            stats.sqft != null ? Number(stats.sqft).toLocaleString() : "—"
          }
        />
        <Stat label="Year Built" value={stats.yearBuilt ?? "—"} />
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className={glass} title={hint}>
      <p className={`text-xs ${textMeta}`}>{label}</p>
      <p className="mt-1 text-lg md:text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}