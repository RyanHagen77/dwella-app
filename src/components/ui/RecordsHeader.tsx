"use client";

import * as React from "react";
import Link from "next/link";
import { heading, textMeta } from "@/lib/glass";

type RecordsHeaderProps = {
  title: string;
  meta?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  right?: React.ReactNode; // ✅ shows on ALL breakpoints (mobile + desktop)
};

export function RecordsHeader({ title, meta, backHref, backLabel, right }: RecordsHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel ?? "Back"}
            className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
          >
            ←
          </Link>
        ) : null}

        <div className="min-w-0">
          <h1 className={`truncate text-2xl font-bold ${heading}`}>{title}</h1>
          {meta ? <p className={`mt-1 text-sm ${textMeta}`}>{meta}</p> : null}
        </div>
      </div>

      {right ? <div className="flex-shrink-0">{right}</div> : null}
    </header>
  );
}