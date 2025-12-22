"use client";

import * as React from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { ctaGhost, textMeta } from "@/lib/glass";

function Chevron({ open }: { open: boolean }) {
  return <span className="text-white/55">{open ? "▴" : "▾"}</span>;
}

export function ContractorHeader({
  title,
  backHref,
  metaLine,
  detailsCount,
  details,
  messageHref,
}: {
  title: string;
  backHref: string;
  metaLine: React.ReactNode;
  detailsCount: number;
  details: React.ReactNode;
  messageHref: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        backHref={backHref}
        backLabel="Back to contractors"
        meta={metaLine}
        rightDesktop={
          <Link href={messageHref} className={ctaGhost}>
            💬 Message
          </Link>
        }
      />

      {/* Mobile: Details toggle pill */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm text-white/85 transition-colors hover:bg-black/25 hover:border-white/25"
          aria-expanded={open}
        >
          <span>Details</span>

          {detailsCount > 0 ? (
            <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full border border-white/20 bg-white/10 px-1.5 text-xs font-semibold text-white/90">
              {detailsCount}
            </span>
          ) : (
            <span className={`ml-1 text-sm ${textMeta}`}>(All)</span>
          )}

          <Chevron open={open} />
        </button>
      </div>

      {/* Drawer: collapsed on mobile, always open on desktop */}
      <div
        className={[
          "overflow-hidden sm:overflow-visible",
          "transition-[max-height,opacity] duration-200 ease-out",
          open ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          "sm:max-h-none sm:opacity-100",
        ].join(" ")}
      >
        <div className="pt-3 sm:pt-0">{details}</div>
      </div>
    </div>
  );
}