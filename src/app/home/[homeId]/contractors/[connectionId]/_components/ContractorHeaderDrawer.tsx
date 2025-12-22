"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { GhostButton } from "@/components/ui/Button";

function formatMoney(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function Caret({ open }: { open: boolean }) {
  return <span className="text-white/55">{open ? "▴" : "▾"}</span>;
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
      {/* Clean standard header: title only */}
      <PageHeader title={title} backHref={backHref} backLabel={backLabel} />

      {/* Clean action row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GhostButton type="button" onClick={() => router.push(messageHref)}>
            💬 Message
          </GhostButton>

          {/* Subtle toggle like Filters (no (All), no count) */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/15 px-3 py-2 text-sm text-white/80 transition-colors hover:border-white/20 hover:bg-black/20"
          >
            <span className="text-white/70">Details</span>
            <Caret open={open} />
          </button>
        </div>

        {/* Plain green stats (no pill, no box) */}
        <div className="text-sm font-medium text-[#33C17D]">
          {spent} spent <span className="text-white/35">•</span> {jobs} verified jobs
        </div>
      </div>

      {/* Collapsible content */}
      <div
        className={[
          "overflow-hidden",
          "transition-[max-height,opacity] duration-200 ease-out",
          open ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="pt-3">{children}</div>
      </div>
    </div>
  );
}