"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { heading, textMeta, indigoActionLink } from "@/lib/glass";
import { Phone, Mail, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";

function formatMoney(amount?: number | null) {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

const iconBtn =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl " +
  "border border-white/15 bg-black/20 text-white/80 " +
  "transition hover:bg-black/25 hover:text-white";

const iconBtnDisabled =
  "inline-flex h-9 w-9 items-center justify-center rounded-xl " +
  "border border-white/10 bg-black/15 text-white/30";

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
          <Link href={backHref} aria-label={backLabel ?? "Back"} className={iconBtn}>
            ←
          </Link>

          <div className="min-w-0">
            <h1 className={`truncate text-2xl font-bold ${heading}`}>{title}</h1>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-1">
          {hasPhone ? (
            <a href={`tel:${phone}`} aria-label="Call contractor" title="Call" className={iconBtn}>
              <Phone className="h-[18px] w-[18px]" />
            </a>
          ) : (
            <span aria-label="No phone number on file" title="No phone number" className={iconBtnDisabled}>
              <Phone className="h-[18px] w-[18px]" />
            </span>
          )}

          <button
            type="button"
            onClick={() => router.push(messageHref)}
            aria-label="Message contractor"
            title="Message"
            className={iconBtn}
          >
            <Mail className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between gap-3">
        {/* keep this subtle + consistent with list meta */}
        <div className={`text-sm ${textMeta}`}>
          <span className="text-white/85">{spent}</span> spent <span className="mx-2 text-white/35">•</span>{" "}
          <span className="text-white/85">{jobs}</span> verified jobs
        </div>

        {/* optional: make this match your indigo link standard */}
        <span className={indigoActionLink}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="inline-flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Details</span>
            {open ? (
              <ChevronUp className="h-4 w-4 text-white/55" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white/55" />
            )}
          </button>
        </span>
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