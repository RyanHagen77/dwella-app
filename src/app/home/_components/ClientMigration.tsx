// src/app/stats/[homeId]/_components/ClientMigration.tsx
"use client";

import { useEffect, useState } from "react";

type AnyRec = Record<string, any>;

export default function ClientMigration({ homeId }: { homeId: string }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        // Ask server if migration already recorded to avoid reading LS needlessly
        const check = await fetch(`/api/home/${homeId}/migration-status`, { cache: "no-store" });
        if (!check.ok) return;
        const { migrated } = await check.json();
        if (migrated) { setDone(true); return; }

        // Pull demo data from localStorage
        const records: AnyRec[] = JSON.parse(localStorage.getItem("stats:records") ?? "[]");
        const reminders: AnyRec[] = JSON.parse(localStorage.getItem("stats:reminders") ?? "[]");
        const warranties: AnyRec[] = JSON.parse(localStorage.getItem("stats:warranties") ?? "[]");

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
          setDone(true);
        }
      } catch (_) {
        // Silently ignore; user can retry by refreshing
      }
    }

    run();
    return () => { cancelled = true; };
  }, [homeId]);

  return done ? null : <span className="sr-only">Migrating…</span>;
}