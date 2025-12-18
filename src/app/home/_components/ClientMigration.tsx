// src/app/stats/[homeId]/_components/ClientMigration.tsx
"use client";

import { useEffect, useState } from "react";

type UnknownRec = Record<string, unknown>;

function safeParseArray(key: string): UnknownRec[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as UnknownRec[]) : [];
  } catch {
    return [];
  }
}

export default function ClientMigration({ homeId }: { homeId: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Ask server if migration already recorded to avoid reading LS needlessly
        const check = await fetch(`/api/home/${homeId}/migration-status`, { cache: "no-store" });
        if (!check.ok) return;

        const data = (await check.json().catch(() => null)) as { migrated?: boolean } | null;
        if (data?.migrated) {
          if (!cancelled) setDone(true);
          return;
        }

        // Pull demo data from localStorage
        const records = safeParseArray("stats:records");
        const reminders = safeParseArray("stats:reminders");
        const warranties = safeParseArray("stats:warranties");

        const payload = { records, reminders, warranties };

        const res = await fetch(`/api/home/${homeId}/migrate-local`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          // Clear the demo data for this app so we never double-import
          localStorage.removeItem("stats:records");
          localStorage.removeItem("stats:reminders");
          localStorage.removeItem("stats:warranties");

          if (!cancelled) setDone(true);
        }
      } catch {
        // Silently ignore; user can retry by refreshing
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [homeId]);

  return done ? null : <span className="sr-only">Migrating…</span>;
}