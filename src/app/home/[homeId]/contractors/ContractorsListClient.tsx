// app/home/[homeId]/contractors/ContractorsListClient.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { glass } from "@/lib/glass";

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

export function ContractorsListClient({
  homeId,
  activeConnections,
  archivedConnections,
}: Props) {
  return (
    <div className="space-y-6">
      {activeConnections.length > 0 && (
        <section className={glass}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/70">
            Active Contractors ({activeConnections.length})
          </h2>
          <div className="space-y-3">
            {activeConnections.map((conn) => (
              <ContractorCard
                key={conn.id}
                homeId={homeId}
                connection={conn}
                statusLabel="Active"
              />
            ))}
          </div>
        </section>
      )}

      {archivedConnections.length > 0 && (
        <section className={glass}>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-white/70">
            Archived ({archivedConnections.length})
          </h2>
          <div className="space-y-3">
            {archivedConnections.map((conn) => (
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
      )}
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
  statusLabel: string;
  dimmed?: boolean;
}) {
  const contractor = connection.contractor;
  const href = `/home/${homeId}/contractors/${connection.id}`;

  const name =
    contractor?.businessName || contractor?.name || contractor?.email || "Contractor";

  const lastServiceDate = connection.lastServiceDate
    ? new Date(connection.lastServiceDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const createdAtLabel = new Date(connection.createdAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <Link
      href={href}
      className={`block rounded-lg border p-4 transition-colors ${
        dimmed
          ? "border-white/10 bg-white/5 hover:bg-white/10 opacity-80"
          : "border-white/10 bg-white/5 hover:bg-white/10"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        {contractor?.image ? (
          <Image
            src={contractor.image}
            alt={name}
            width={48}
            height={48}
            className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20 text-lg font-semibold text-orange-300">
            {name[0]?.toUpperCase() || "C"}
          </div>
        )}

        <div className="min-w-0 flex-1">
          {/* Top row: name + status + arrow */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white">
                  {name}
                </h3>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                    statusLabel === "Active"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {statusLabel}
                </span>
              </div>

              {contractor?.email && (
                <p className="truncate text-xs text-white/60">
                  {contractor.email}
                </p>
              )}
            </div>

            <div className="flex items-center text-white/40">
              {/* Right arrow to indicate clickability */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </div>
          </div>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-white/60">
            <span>
              Connected {createdAtLabel}
            </span>

            {lastServiceDate && (
              <span>Last work: {lastServiceDate}</span>
            )}

            <span>
              Verified jobs: {connection.verifiedServiceCount}
            </span>

            {connection.totalSpent > 0 && (
              <span>
                Spent: ${connection.totalSpent.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}