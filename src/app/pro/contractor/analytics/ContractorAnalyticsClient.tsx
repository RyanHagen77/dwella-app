// app/pro/contractor/analytics/ContractorAnalyticsClient.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  glass,
  glassTight,
  heading,
  textMeta,
  ctaPrimary,
  ctaGhost,
} from "@/lib/glass";

import { InviteHomeownerButton } from "../../_components/InviteHomeownerButton";


type ContractorAnalyticsClientProps = {
  businessName: string | null;
  proType: "CONTRACTOR" | "REALTOR" | "INSPECTOR" | null;
  verified: boolean;
  rating: number | null;
  activeClients: number;
};

export default function ContractorAnalyticsClient(
  props: ContractorAnalyticsClientProps
) {
  const { businessName, proType, verified, rating, activeClients } = props;

  const proLabel = useMemo(() => {
    if (proType === "CONTRACTOR") return "Contractor";
    if (proType === "REALTOR") return "Realtor";
    if (proType === "INSPECTOR") return "Inspector";
    return "Professional";
  }, [proType]);

  // These can be wired later to real analytics queries.
  // For now they’re guide rails / placeholders.
  const sampleConversionRate = 0; // 0–1
  const sampleVerifiedShare = 0; // 0–1
  const sampleRecencyScore = 0; // 0–1

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className={glass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${heading}`}>
              Analytics & Insights
            </h1>
            <p className={textMeta}>
              See how your{" "}
              <span className="font-medium text-white/90">{businessName || "business"}</span>{" "}
              is performing on MyHomeDox.
            </p>
            <p className={`mt-1 text-xs ${textMeta}`}>
              These insights will get richer as you document work and invite
              homeowners.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pro/contractor/service-records/new"
              className={`${ctaPrimary} px-4 py-2 text-sm`}
            >
              + Document Services
            </Link>
            <InviteHomeownerButton />
          </div>
        </div>
      </section>

      {/* Top metrics row */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Active Clients"
          value={activeClients.toString()}
          helper="Homeowners currently connected to you"
        />
        <MetricCard
          label="Avg Rating"
          value={rating ? `${rating.toFixed(1)} ★` : "—"}
          helper="Based on verified homeowner reviews (coming soon)"
        />
        <MetricCard
          label="Verified Work"
          value="—"
          helper="Jobs verified by homeowners will show here"
        />
        <MetricCard
          label="This Month's Revenue"
          value="—"
          helper="Estimated revenue from documented work (coming soon)"
        />
      </section>

      {/* Deep dive grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Funnel / onboarding guidance */}
        <section className={`space-y-4 lg:col-span-2 ${glass}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={`text-xl font-semibold ${heading}`}>
              Growth Funnel
            </h2>
            <p className={`text-xs ${textMeta}`}>
              Turn real-world jobs into a verified portfolio.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FunnelStep
              step="1"
              title="Connect Homes"
              description="Invite homeowners you’ve worked with to connect their property."
              href="/pro/contractor/invitations"
              cta="Send invite"
              status={activeClients > 0 ? "done" : "todo"}
            />
            <FunnelStep
              step="2"
              title="Document Service"
              description="Log installs, repairs, and inspections as work records."
              href="/pro/contractor/service-records/new"
              cta="Document services"
            />
            <FunnelStep
              step="3"
              title="Get Verified"
              description="Ask homeowners to verify your records and leave reviews."
              href="/pro/contractor/service-records"
              cta="View records"
            />
          </div>

          {/* Placeholder “sparkline” guidance */}
          <div className="mt-2 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className={`mb-2 text-sm font-medium ${heading}`}>
              Once you start documenting work…
            </p>
            <p className={`text-sm ${textMeta}`}>
              You’ll see trends here like{" "}
              <span className="text-white/90">
                jobs per month, total verified work, and estimated revenue
              </span>{" "}
              so you can quickly answer questions like:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-white/80">
              <li>How many jobs did I complete this month?</li>
              <li>Which types of work bring in the most revenue?</li>
              <li>What share of my work is homeowner-verified?</li>
            </ul>
          </div>
        </section>

        {/* Right: Quality / trust panel */}
        <section className={glass}>
          <h2 className={`mb-3 text-xl font-semibold ${heading}`}>
            Trust & Profile Strength
          </h2>
          <p className={`mb-4 text-sm ${textMeta}`}>
            Homeowners and agents rely on your track record. These indicators
            show how strong your presence looks today.
          </p>

          <ProfileStrengthRow
            label="Profile completeness"
            value={
              verified
                ? "Verified business"
                : "Add details & get verified"
            }
            progress={verified ? 0.8 : 0.4}
          />
          <ProfileStrengthRow
            label="Verified work share"
            value="0% (no verified work yet)"
            progress={sampleVerifiedShare}
          />
          <ProfileStrengthRow
            label="Recent activity"
            value="No recent service records"
            progress={sampleRecencyScore}
          />
          <ProfileStrengthRow
            label="Conversion from invite → connection"
            value="Not enough data yet"
            progress={sampleConversionRate}
          />

          <div className="mt-4 space-y-2">
            <Link
              href="/pro/profile"
              className="block text-sm text-white/80 underline-offset-2 hover:underline"
            >
              Complete your public profile →
            </Link>
            <Link
              href="/pro/contractor/invitations"
              className="block text-sm text-white/80 underline-offset-2 hover:underline"
            >
              Review pending invitations →
            </Link>
          </div>
        </section>
      </div>

      {/* Bottom: Suggested next steps */}
      <section className={glass}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className={`text-lg font-semibold ${heading}`}>
              Make your analytics meaningful
            </h2>
            <p className={textMeta}>
              Your charts and metrics will unlock as you connect homes,
              document work, and collect reviews from homeowners.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/pro/contractor/invitations"
              className={`${ctaPrimary} px-4 py-2 text-sm`}
            >
              Invite a homeowner
            </Link>
            <Link
              href="/pro/contractor/service-records/new"
              className={`${ctaGhost} px-4 py-2 text-sm`}
            >
              Log a recent job
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ========== Small components ========== */

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className={glass}>
      <p className={`text-sm font-medium ${textMeta}`}>{label}</p>
      <p className={`mt-2 text-3xl font-bold ${heading}`}>{value}</p>
      {helper && (
        <p className={`mt-1 text-xs text-white/60`}>{helper}</p>
      )}
    </div>
  );
}

function FunnelStep({
  step,
  title,
  description,
  href,
  cta,
  status = "todo",
}: {
  step: string;
  title: string;
  description: string;
  href: string;
  cta: string;
  status?: "todo" | "done";
}) {
  const badgeClasses =
    status === "done"
      ? "bg-green-400/20 text-green-200 border-green-400/40"
      : "bg-white/10 text-white/80 border-white/25";

  return (
    <div className={glassTight}>
      <div className="mb-2 flex items-center justify-between">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${badgeClasses}`}
        >
          {status === "done" ? "✓" : step}
        </span>
        <span className="text-xs text-white/60">
          {status === "done" ? "In progress" : "Next step"}
        </span>
      </div>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className={`mt-1 text-xs ${textMeta}`}>{description}</p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center text-xs font-medium text-white/90 underline-offset-2 hover:underline"
      >
        {cta} →
      </Link>
    </div>
  );
}

function ProfileStrengthRow({
  label,
  value,
  progress,
}: {
  label: string;
  value: string;
  progress: number; // 0–1
}) {
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/80">{label}</span>
        <span className="text-white/60">{value}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-sky-400"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}