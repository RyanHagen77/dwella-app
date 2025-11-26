"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { glass } from "@/lib/glass";

type Connection = {
  id: string;
  createdAt: string;
  archivedAt: string | null;
  lastWorkDate: string | null;
  contractorId: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    businessName: string | null;
  } | null;
  verifiedWorkCount: number;
  totalSpent: number;
};

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function ContractorsListClient({
  homeId,
  activeConnections,
  archivedConnections,
}: {
  homeId: string;
  activeConnections: Connection[];
  archivedConnections: Connection[];
}) {
  const [view, setView] = useState<"active" | "archived">("active");

  const connections = view === "active" ? activeConnections : archivedConnections;

  return (
    <>
      {/* Pills - only show if there are archived connections */}
      {archivedConnections.length > 0 && (
        <div className="flex gap-2">
          <button
            onClick={() => setView("active")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              view === "active"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Active ({activeConnections.length})
          </button>
          <button
            onClick={() => setView("archived")}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              view === "archived"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/70 hover:bg-white/10"
            }`}
          >
            Archived ({archivedConnections.length})
          </button>
        </div>
      )}

      {/* List */}
      {connections.length === 0 ? (
        <section className={glass}>
          <div className="py-8 text-center text-white/70">
            {view === "active" ? (
              <>
                <div className="text-4xl mb-3">👷</div>
                <p>No active contractors</p>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">📦</div>
                <p>No archived contractors</p>
              </>
            )}
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {connections.map((conn) => (
            <ContractorRow
              key={conn.id}
              connection={conn}
              homeId={homeId}
              isArchived={view === "archived"}
            />
          ))}
        </section>
      )}
    </>
  );
}

function ContractorRow({
  connection,
  homeId,
  isArchived,
}: {
  connection: Connection;
  homeId: string;
  isArchived: boolean;
}) {
  const router = useRouter();
  const [isRestoring, setIsRestoring] = useState(false);

  const contractor = connection.contractor;
  if (!contractor) return null;

  const displayName = contractor.businessName || contractor.name || contractor.email;
  const initials = (displayName || "C")[0].toUpperCase();

  const handleReconnect = async () => {
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/home/${homeId}/connections/${connection.id}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to reconnect:", err);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className={`${glass} ${isArchived ? "opacity-75" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Avatar + Info */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {contractor.image ? (
            <Image
              src={contractor.image}
              alt={displayName}
              width={48}
              height={48}
              className="rounded-full object-cover flex-shrink-0 sm:w-14 sm:h-14"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold text-lg sm:text-xl flex-shrink-0">
              {initials}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                {displayName}
              </h3>
              {isArchived && (
                <span className="inline-block rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400">
                  Archived
                </span>
              )}
            </div>
            {contractor.businessName && contractor.name && (
              <p className="text-sm text-white/60 truncate">{contractor.name}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs sm:text-sm text-white/50">
              {isArchived && connection.archivedAt ? (
                <span>Disconnected {formatDate(connection.archivedAt)}</span>
              ) : (
                <>
                  <span>Connected {formatDate(connection.createdAt)}</span>
                  {connection.lastWorkDate && (
                    <span>Last work {formatDate(connection.lastWorkDate)}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats + Actions */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 sm:flex-nowrap">
          {/* Stats */}
          <div className="flex gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-lg font-semibold text-white">{connection.verifiedWorkCount}</div>
              <div className="text-xs text-white/50">Verified Jobs</div>
            </div>
            {connection.totalSpent > 0 && (
              <div className="text-center">
                <div className="text-lg font-semibold text-green-400">
                  ${connection.totalSpent.toLocaleString()}
                </div>
                <div className="text-xs text-white/50">Total Spent</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 ml-auto">
            {isArchived ? (
              <button
                onClick={handleReconnect}
                disabled={isRestoring}
                className="px-3 py-2 text-sm rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50"
              >
                {isRestoring ? "Restoring..." : "Reconnect"}
              </button>
            ) : (
              <>
                <Link
                  href={`/home/${homeId}/messages/${connection.id}`}
                  className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  Message
                </Link>
                <Link
                  href={`/home/${homeId}/contractors/${connection.id}`}
                  className="px-3 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  View →
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}