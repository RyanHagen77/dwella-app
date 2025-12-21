"use client";

import * as React from "react";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";

export function PageHeader({
  backHref,
  backLabel,
  title,
  meta,
  rightDesktop,
}: {
  backHref: string;
  backLabel: string;
  title: string;
  meta?: React.ReactNode;
  rightDesktop?: React.ReactNode;
}) {
  return (
    <section
      className={[
        glass,
        // Mobile: flatten the “card” feel and let it breathe full-width
        "rounded-2xl sm:rounded-2xl",
        "-mx-6 sm:mx-0",
        "px-4 py-4 sm:p-6",
      ].join(" ")}
    >
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Link
            href={backHref}
            aria-label={backLabel}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition-colors hover:bg-white/15"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className={`text-2xl font-bold ${heading}`}>{title}</h1>
            {meta ? <div className={`mt-1 text-sm ${textMeta}`}>{meta}</div> : null}
          </div>
        </div>

        {/* Desktop-only right slot */}
        {rightDesktop ? <div className="hidden sm:block">{rightDesktop}</div> : null}
      </div>
    </section>
  );
}