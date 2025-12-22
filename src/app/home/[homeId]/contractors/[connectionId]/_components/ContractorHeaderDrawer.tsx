"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { heading } from "@/lib/glass";
import {
  Phone,
  Mail,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

function formatMoney(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ContractorHeaderDrawer({
  title,
  backHref,
  backLabel,
  messageHref,
  phone,
  spendAmount,
  verifiedJobs,
  children,
}: {
  title: string;
  backHref: string;
  backLabel?: string;
  messageHref: string;
  phone?: string | null;
  spendAmount?: number | null;
  verifiedJobs?: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  const spent = formatMoney(spendAmount);
  const jobs = verifiedJobs ?? 0;

  const hasPhone = Boolean(phone && phone.trim().length > 0);

  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <Link
            href={backHref}
            aria-label={backLabel ?? "Back"}
            className="mt-1 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-white/80"
          >
            ←
          </Link>

          <div className="min-w-0">
            <h1 className={`truncate text-2xl font-bold ${heading}`}>{title}</h1>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          {/* Call (enabled if phone exists, otherwise disabled) */}
          {hasPhone ? (
            <a
              href={`tel:${phone}`}
              aria-label="Call contractor"
              title="Call"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/85 hover:bg-white/5 hover:text-white"
            >
              <Phone className="h-[18px] w-[18px]" />
            </a>
          ) : (
            <span
              aria-label="No phone number on file"
              title="No phone number"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/30"
            >
              <Phone className="h-[18px] w-[18px]" />
            </span>
          )}

          {/* Message */}
          <button
            type="button"
            onClick={() => router.push(messageHref)}
            aria-label="Message contractor"
            title="Message"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/85 hover:bg-white/5 hover:text-white"
          >
            <Mail className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium text-[#33C17D]">
          {spent} spent <span className="mx-2 text-white/35">•</span> {jobs} verified jobs
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span>Details</span>
          {open ? (
            <ChevronUp className="h-4 w-4 text-white/55" />
          ) : (
            <ChevronDown className="h-4 w-4 text-white/55" />
          )}
        </button>
      </div>

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