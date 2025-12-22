"use client";

import * as React from "react";
import Link from "next/link";
import { heading, textMeta } from "@/lib/glass";

export function RecordsHeader({
  backHref,
  backLabel = "Back",
  title,
  meta,
  action,
}: {
  backHref: string;
  backLabel?: string;
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={backHref}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
          aria-label={backLabel}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
        </Link>

        <div className="min-w-0">
          <h1 className={`truncate text-2xl font-bold ${heading}`}>{title}</h1>
          {meta ? <div className={`mt-1 text-sm ${textMeta}`}>{meta}</div> : null}
        </div>
      </div>

      {action ? <div className="flex-shrink-0">{action}</div> : null}
    </div>
  );
}