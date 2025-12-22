// app/home/[homeId]/contractors/ContractorsListClient.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

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
  activeConnections: ContractorConnection[];
  archivedConnections: ContractorConnection[];
};

const sectionSurface = "rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl";
const cardLink =
  "block rounded-2xl border border-white/12 bg-black/25 p-5 transition-colors " +
  "hover:border-white/20 hover:bg-black/30";

export function ContractorsListClient({
  homeId,
  activeConnections,
  archivedConnections,
}: Props) {
  const active = activeConnections ?? [];
  const archived = archivedConnections ?? [];

  return (
    <div className="space-y-6">
      {active.length > 0 ? (
        <section className={sectionSurface}>
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/55">
            Active ({active.length})
          </div>
          <div className="space-y-3">
            {active.map((conn) => (
              <ContractorCard key={conn.id} homeId={homeId} connection={conn} statusLabel="Active" />
            ))}
          </div>
        </section>
      ) : null}

      {archived.length > 0 ? (
        <section className={sectionSurface}>
          <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/55">
            Archived ({archived.length})
          </div>
          <div className="space-y-3">
            {archived.map((conn) => (
              <ContractorCard
                key={conn.id}
                homeId={homeId}
                connection={conn}
                statusLabel="Archived"
                dimmed
              />
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
    ? new Date(connection.lastServiceDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const createdAtLabel = new Date(connection.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link href={href} className={[cardLink, dimmed ? "opacity-85" : ""].join(" ")}>
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {contractor?.image ? (
          <Image
            src={contractor.image}
            alt={name}
            width={48}
            height={48}
            className="h-12 w-12 flex-shrink-0 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20 text-lg font-semibold text-white/80">
            {name[0]?.toUpperCase() || "C"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Top row */}
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

              {contractor?.email ? (
                <p className="mt-1 truncate text-xs text-white/60">{contractor.email}</p>
              ) : null}
            </div>

            <div className="flex items-center text-white/40" aria-hidden>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </div>

          {/* Meta row */}
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