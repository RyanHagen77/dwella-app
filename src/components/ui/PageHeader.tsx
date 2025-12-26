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
  rightMobile?: React.ReactNode;
};

export function PageHeader({
  title,
  meta,
  backHref,
  backLabel,
  rightDesktop,
  rightMobile,
}: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      {/* Left */}
      <div className="flex min-w-0 items-start gap-3">
        {backHref ? (
          <Link
            href={backHref}
            aria-label={backLabel ?? "Back"}
            className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
          >
            ←
          </Link>
        ) : null}

        <div className="min-w-0">
          <h1 className={`truncate text-2xl font-bold ${heading}`}>{title}</h1>
          {meta ? <div className={`mt-1 text-sm ${textMeta}`}>{meta}</div> : null}
        </div>
      </div>

      {/* Right */}
      {(rightMobile || rightDesktop) ? (
        <div className="flex flex-shrink-0 items-start">
          {rightMobile ? <div className="sm:hidden">{rightMobile}</div> : null}
          {rightDesktop ? <div className="hidden sm:block">{rightDesktop}</div> : null}
        </div>
      ) : null}
    </header>
  );
}