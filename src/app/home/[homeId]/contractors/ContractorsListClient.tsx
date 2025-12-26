// app/home/[homeId]/contractors/ContractorsListClient.tsx
"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { glass, heading, textMeta, indigoActionLink } from "@/lib/glass";
import { ContractorActions } from "./ContractorActions";

type ContractorConnection = {
  id: string;
  createdAt: string;
  archivedAt: string | null;
  lastServiceDate: string | null;
  contractorId: string;
  contractor: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    businessName: string | null;
  } | null;
  verifiedServiceCount: number;
  totalSpent: number;
};

type Props = {
  homeId: string;
  homeAddress: string;
  activeConnections: ContractorConnection[];
  archivedConnections: ContractorConnection[];
  stats: {
    totalContractors: number;
    activeContractors: number;
    totalVerifiedServices: number;
    totalSpentAmount: number;
  };
};

const cardLink =
  "group relative block overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "transition hover:bg-black/30 hover:border-white/15";

export function ContractorsListClient({
  homeId,
  homeAddress,
  activeConnections,
  archivedConnections,
  stats,
}: Props) {
  const active = activeConnections ?? [];
  const archived = archivedConnections ?? [];

  const [isExpanded, setIsExpanded] = useState(false);

  const actionsHostRef = useRef<HTMLDivElement | null>(null);

  function openInviteModal() {
    const host = actionsHostRef.current;
    if (!host) return;

    const trigger =
      (host.querySelector('button[type="button"]') as HTMLButtonElement | null) ??
      (host.querySelector("button") as HTMLButtonElement | null) ??
      (host.querySelector('a[role="button"]') as HTMLAnchorElement | null);

    trigger?.click();
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div ref={actionsHostRef} className="sr-only">
        <ContractorActions homeId={homeId} homeAddress={homeAddress} />
      </div>

      <section aria-labelledby="contractor-stats" className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="inline-flex items-center gap-2 text-left lg:cursor-default"
        >
          <h2 id="contractor-stats" className={`text-lg font-semibold ${heading}`}>
            Overview
          </h2>

          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform lg:hidden ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>


        <div className={`${isExpanded ? "grid" : "hidden"} grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4`}>
          <StatTile label="Total Pros" value={stats.totalContractors} />
          <StatTile label="Active Pros" value={stats.activeContractors} />
          <StatTile label="Verified Jobs" value={stats.totalVerifiedServices} />
          <StatTile
            label="Total Spent"
            value={stats.totalSpentAmount > 0 ? `$${stats.totalSpentAmount.toLocaleString()}` : "$0"}
          />
        </div>
      </section>

      {active.length > 0 ? (
        <section className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/55">Active ({active.length})</div>
          <div className="space-y-3">
            {active.map((conn) => (
              <ContractorCard key={conn.id} homeId={homeId} connection={conn} statusLabel="Active" />
            ))}
          </div>
        </section>
      ) : null}

      {archived.length > 0 ? (
        <section className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-white/55">
            Archived ({archived.length})
          </div>
          <div className="space-y-3">
            {archived.map((conn) => (
              <ContractorCard key={conn.id} homeId={homeId} connection={conn} statusLabel="Archived" dimmed />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ContractorCard({
  homeId,
  connection,
  statusLabel,
  dimmed = false,
}: {
  homeId: string;
  connection: ContractorConnection;
  statusLabel: "Active" | "Archived";
  dimmed?: boolean;
}) {
  const contractor = connection.contractor;
  const href = `/home/${homeId}/contractors/${connection.id}`;

  const name = contractor?.businessName || contractor?.name || contractor?.email || "Contractor";

  const lastServiceDate = connection.lastServiceDate
    ? new Date(connection.lastServiceDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : null;

  const createdAtLabel = new Date(connection.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={href}
      className={[
        cardLink,
        dimmed ? "opacity-85" : "",
        "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
        statusLabel === "Active" ? "before:bg-emerald-400/70" : "before:bg-white/12",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        {contractor?.image ? (
          <Image
            src={contractor.image}
            alt={name}
            width={48}
            height={48}
            className="h-12 w-12 flex-shrink-0 rounded-2xl border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-lg font-semibold text-white/80">
            {name[0]?.toUpperCase() || "C"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white">{name}</h3>

                <span
                  className={[
                    "inline-flex flex-shrink-0 items-center rounded-full border px-2 py-0.5 text-xs",
                    statusLabel === "Active"
                      ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                      : "border-white/10 bg-white/5 text-white/60",
                  ].join(" ")}
                >
                  {statusLabel}
                </span>
              </div>

              {contractor?.email ? <p className="mt-1 truncate text-xs text-white/60">{contractor.email}</p> : null}
            </div>

            <div className="flex items-center text-white/35" aria-hidden>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/60">
            <span>Connected {createdAtLabel}</span>
            {lastServiceDate ? <span>Last work: {lastServiceDate}</span> : null}
            <span>Verified jobs: {connection.verifiedServiceCount}</span>
            {connection.totalSpent > 0 ? <span>Spent: ${connection.totalSpent.toLocaleString()}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${glass} p-4`} title={label}>
      <p className={`text-xs ${textMeta} whitespace-nowrap`}>{label}</p>
      <p className="mt-2 text-lg lg:text-xl font-bold text-white">{value}</p>
    </div>
  );
}