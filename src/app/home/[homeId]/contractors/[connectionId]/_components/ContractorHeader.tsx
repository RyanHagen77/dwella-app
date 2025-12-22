"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { GhostButton } from "@/components/ui/Button";
import { textMeta } from "@/lib/glass";

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-sm">
      <span className={`text-white/60 ${textMeta}`}>{label}</span>
      <span className="font-semibold text-white/90">{value}</span>
    </div>
  );
}

function formatMoney(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ContractorHeader({
  title,
  backHref,
  metaLine,
  messageHref,
  spendAmount,
  verifiedJobs,
}: {
  title: string;
  backHref: string;
  metaLine?: React.ReactNode;
  messageHref: string;
  spendAmount?: number | null;
  verifiedJobs?: number | null;
}) {
  const router = useRouter();
  const safeJobs = verifiedJobs ?? 0;

  const goMessage = React.useCallback(() => {
    router.push(messageHref);
  }, [router, messageHref]);

  return (
    <div className="space-y-4">
      <PageHeader
        title={title}
        backHref={backHref}
        backLabel="Back to contractors"
        meta={metaLine}
        rightDesktop={
          <GhostButton type="button" onClick={goMessage}>
            💬 Message
          </GhostButton>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <StatPill label="Spend" value={formatMoney(spendAmount)} />
        <StatPill label="Verified jobs" value={safeJobs} />

        <div className="sm:hidden">
          <GhostButton type="button" onClick={goMessage}>
            💬 Message
          </GhostButton>
        </div>
      </div>
    </div>
  );
}