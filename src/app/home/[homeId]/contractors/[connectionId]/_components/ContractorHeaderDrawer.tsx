"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ctaGhost, textMeta } from "@/lib/glass";

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/70">
      <path
        d="M12 17v-6M12 7h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ContractorHeaderDrawer({
  title,
  meta,
  backHref,
  backLabel,
  messageHref,
  detailsCount,
  children,
}: {
  title: string;
  meta?: React.ReactNode;
  backHref: string;
  backLabel?: string;
  messageHref: string;
  detailsCount: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        meta={meta}
        backHref={backHref}
        backLabel={backLabel}
        rightDesktop={
          <Link href={messageHref} className={ctaGhost}>
            💬 Message
          </Link>
        }
      />

      {/* Mobile: Message + Details toggle (quiet, no orange) */}
      <div className="flex gap-2 sm:hidden">
        <Link href={messageHref} className={`${ctaGhost} flex-1`}>
          💬 Message
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={
            "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/85 " +
            "transition-colors hover:bg-black/25 hover:border-white/25"
          }
          aria-expanded={open}
        >
          <InfoIcon />
          <span>Details</span>

          {detailsCount > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-xs font-semibold text-white/90">
              {detailsCount}
            </span>
          ) : (
            <span className={`ml-1 ${textMeta}`}>(All)</span>
          )}

          <span className="ml-1 text-white/55">{open ? "▴" : "▾"}</span>
        </button>
      </div>

      {/* Drawer: collapsed on mobile, always visible on desktop */}
      <div
        className={[
          "overflow-hidden sm:overflow-visible",
          "transition-[max-height,opacity] duration-200 ease-out",
          open ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0",
          "sm:max-h-none sm:opacity-100",
        ].join(" ")}
      >
        <div className="pt-3 sm:pt-0">{children}</div>
      </div>
    </div>
  );
}