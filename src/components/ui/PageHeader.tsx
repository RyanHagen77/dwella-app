"use client";

import * as React from "react";
import Link from "next/link";
import { heading, textMeta } from "@/lib/glass";

type PageHeaderProps = {
  title: string;
  meta?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
  rightDesktop?: React.ReactNode;
};

export function PageHeader({
  title,
  meta,
  backHref,
  backLabel,
  rightDesktop,
}: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel ?? "Back"}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
          >
            ←
          </Link>
        ) : null}

        <div className="min-w-0">
          <h1 className={`text-2xl font-bold ${heading}`}>{title}</h1>

          {/* meta can be any ReactNode; don't wrap in <p> to avoid invalid nesting */}
          {meta ? <div className={`mt-1 text-sm ${textMeta}`}>{meta}</div> : null}
        </div>
      </div>

      {rightDesktop ? <div className="hidden sm:block">{rightDesktop}</div> : null}
    </header>
  );
}