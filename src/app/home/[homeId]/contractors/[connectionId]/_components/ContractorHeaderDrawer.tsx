"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GhostButton } from "@/components/ui/Button";
import { heading } from "@/lib/glass";

function formatMoney(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-white/65">
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ContractorHeaderDrawer({
  title,
  backHref,
  backLabel,
  messageHref,
  spendAmount,
  verifiedJobs,
  children,
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  messageHref: string;
  spendAmount?: number | null;
  verifiedJobs?: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const spent = formatMoney(spendAmount);
  const jobs = verifiedJobs ?? 0;

  return (
    <div className="space-y-3">
      {/* Row 1: Back + Title (left) and Message (right) — mobile-safe */}
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <Link
            href={backHref}
            aria-label={backLabel ?? "Back"}
            className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
          >
            ←
          </Link>

          <div className="min-w-0">
            <h1 className={`text-2xl font-bold ${heading} truncate`}>{title}</h1>
          </div>
        </div>

<GhostButton
  type="button"
  onClick={() => router.push(messageHref)}
  size="sm"
  className="h-9 rounded-xl px-3 border-white/10 bg-transparent hover:bg-white/5 flex-shrink-0"
>
  💬 Message
</GhostButton>
      </header>

      {/* Row 2: Green stats under title (left) + Details (right) */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-[#33C17D]">
          {spent} spent <span className="mx-2 text-white/35">•</span> {jobs} verified jobs
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white flex-shrink-0"
        >
          <SlidersIcon />
          <span>Details</span>
          <span className="text-white/55">{open ? "▴" : "▾"}</span>
        </button>
      </div>

      {/* Collapsible details */}
      <div
        className={[
          "overflow-hidden",
          "transition-[max-height,opacity] duration-200 ease-out",
          open ? "max-h-[720px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}