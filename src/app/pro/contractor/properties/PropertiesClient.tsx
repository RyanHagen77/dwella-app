"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta, ctaGhost } from "@/lib/glass";
import { Input } from "@/components/ui";

type Property = {
  id: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  homeownerName: string;
  homeownerEmail: string;
  homeownerImage: string | null;
  connectionStatus: string;
  jobCount: number;
  lastWorkDate: string | null;
  lastWorkTitle: string | null;
  imageUrl: string | null;
  verifiedWorkCount: number;
  totalSpent: number | null;
  daysSinceLastWork: number | null;
  // Opportunities
  expiringWarranties: Array<{ item: string; expiresAt: string; daysUntil: number }>;
  upcomingReminders: Array<{ title: string; dueAt: string; daysUntil: number }>;
  // Requests
  pendingRequests: Array<{ id: string; title: string; urgency: string }>;
};

type PropertiesClientProps = {
  properties: Property[];
};

type FilterType = "all" | "active" | "past" | "opportunities" | "needs-attention" | "pending";

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get('filter') as FilterType | null;

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");

  // Set filter from URL on mount
  useEffect(() => {
    if (urlFilter && ['opportunities', 'needs-attention', 'pending'].includes(urlFilter)) {
      setFilter(urlFilter);
    }
  }, [urlFilter]);

  const counts = useMemo(
    () => ({
      all: properties.length,
      active: properties.filter((p) => p.connectionStatus === "ACTIVE").length,
      past: properties.filter((p) => p.connectionStatus !== "ACTIVE").length,
      opportunities: properties.filter(
        (p) => (p.expiringWarranties?.length || 0) + (p.upcomingReminders?.length || 0) > 0
      ).length,
      needsAttention: properties.filter(
        (p) => !p.lastWorkDate || (p.daysSinceLastWork ?? 999) > 180
      ).length,
      pending: properties.filter((p) => (p.pendingRequests?.length || 0) > 0).length,
    }),
    [properties]
  );

  const filtered = useMemo(() => {
    let list = properties;

    // Filter by type
    if (filter === "active") {
      list = list.filter((p) => p.connectionStatus === "ACTIVE");
    } else if (filter === "past") {
      list = list.filter((p) => p.connectionStatus !== "ACTIVE");
    } else if (filter === "opportunities") {
      list = list.filter(
        (p) => (p.expiringWarranties?.length || 0) + (p.upcomingReminders?.length || 0) > 0
      );
    } else if (filter === "needs-attention") {
      list = list.filter(
        (p) => !p.lastWorkDate || (p.daysSinceLastWork ?? 999) > 180
      );
    } else if (filter === "pending") {
      list = list.filter((p) => (p.pendingRequests?.length || 0) > 0);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q) ||
          p.homeownerName.toLowerCase().includes(q)
      );
    }

    // Sort by priority
    return list.sort((a, b) => {
      // Pending requests first
      const aPending = a.pendingRequests?.length || 0;
      const bPending = b.pendingRequests?.length || 0;
      if (aPending > bPending) return -1;
      if (bPending > aPending) return 1;

      // Then opportunities
      const aOpps = (a.expiringWarranties?.length || 0) + (a.upcomingReminders?.length || 0);
      const bOpps = (b.expiringWarranties?.length || 0) + (b.upcomingReminders?.length || 0);
      if (aOpps > bOpps) return -1;
      if (bOpps > aOpps) return 1;

      // Then by last work date (most recent first)
      if (a.lastWorkDate && b.lastWorkDate) {
        return new Date(b.lastWorkDate).getTime() - new Date(a.lastWorkDate).getTime();
      }
      if (a.lastWorkDate) return -1;
      if (b.lastWorkDate) return 1;

      return 0;
    });
  }, [properties, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className={glass}>
        <div className="flex flex-col gap-3">
          {/* Top row - main filters */}
          <div className="flex flex-wrap gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All ({counts.all})
            </Chip>
            <Chip active={filter === "active"} onClick={() => setFilter("active")}>
              Active Clients ({counts.active})
            </Chip>
            <Chip active={filter === "past"} onClick={() => setFilter("past")}>
              Past Work ({counts.past})
            </Chip>
          </div>

          {/* Second row - action filters */}
          <div className="flex flex-wrap gap-2">
            <Chip
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
              variant="orange"
            >
              🔴 Pending Requests ({counts.pending})
            </Chip>
            <Chip
              active={filter === "opportunities"}
              onClick={() => setFilter("opportunities")}
              variant="blue"
            >
              🎯 Growth Opportunities ({counts.opportunities})
            </Chip>
            <Chip
              active={filter === "needs-attention"}
              onClick={() => setFilter("needs-attention")}
              variant="yellow"
            >
              ⚡ Needs Follow-up ({counts.needsAttention})
            </Chip>
          </div>

          {/* Search */}
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search properties or homeowners..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Properties Grid / Empty state */}
      {filtered.length === 0 ? (
        <section className={glass}>
          <div className="py-10 text-center">
            <div className="mb-4 text-5xl">
              {filter === "opportunities" ? "🎯" : filter === "needs-attention" ? "⚡" : "🏠"}
            </div>
            <p className="mb-2 text-lg text-white">
              {filter === "opportunities" && "No opportunities right now"}
              {filter === "needs-attention" && "All clients are engaged"}
              {filter === "pending" && "No pending requests"}
              {!["opportunities", "needs-attention", "pending"].includes(filter) && "No properties found"}
            </p>
            <p className={textMeta}>
              {searchQuery || filter !== "all"
                ? "No properties match your filters."
                : "Start documenting completed work to see properties here."}
            </p>
            {(searchQuery || filter !== "all") && (
              <button
                className={`${ctaGhost} mt-4`}
                onClick={() => {
                  setSearchQuery("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const hasOpportunities = (property.expiringWarranties?.length || 0) + (property.upcomingReminders?.length || 0) > 0;
  const hasPendingRequests = (property.pendingRequests?.length || 0) > 0;
  const needsAttention = !property.lastWorkDate || (property.daysSinceLastWork ?? 999) > 180;

  // Determine card border color based on status
  let borderColor = "border-white/10";
  if (hasPendingRequests) {
    borderColor = "border-orange-400/30";
  } else if (needsAttention && hasOpportunities) {
    borderColor = "border-yellow-400/30";
  } else if (hasOpportunities) {
    borderColor = "border-blue-400/30";
  } else if (needsAttention) {
    borderColor = "border-yellow-400/20";
  }

  return (
    <Link
      href={`/pro/contractor/properties/${property.id}`}
      className={`${glass} group block transition hover:bg-white/15 relative border-l-4 ${borderColor}`}
    >
      {/* Property Image */}
      <div className="relative mb-4 h-48 overflow-hidden rounded-lg bg-white/5">
        {property.imageUrl ? (
          <Image
            src={property.imageUrl}
            alt={property.address}
            fill
            className="object-cover transition group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-6xl opacity-20">🏠</span>
          </div>
        )}
        {property.connectionStatus === "ACTIVE" && (
          <div className="absolute right-2 top-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-100">
            Active Client
          </div>
        )}
      </div>

      {/* Homeowner Info */}
      <div className="flex items-center gap-3 mb-3">
        {property.homeownerImage ? (
          <Image
            src={property.homeownerImage}
            alt={property.homeownerName}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-medium">
            {property.homeownerName[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${heading} line-clamp-1 text-base`}>
            {property.homeownerName}
          </h3>
          <p className={`text-sm ${textMeta} truncate`}>{property.address}</p>
        </div>
      </div>

      {/* Action Items */}
      {hasPendingRequests && property.pendingRequests && (
        <div className="mb-3 rounded-md bg-orange-400/10 border border-orange-400/30 px-3 py-2">
          <div className="flex items-center gap-2">
            <span className="text-orange-300 text-sm">📋</span>
            <span className="text-sm text-orange-200 font-medium">
              {property.pendingRequests[0].title}
            </span>
          </div>
          {property.pendingRequests.length > 1 && (
            <p className="text-xs text-orange-300/70 mt-1">
              +{property.pendingRequests.length - 1} more request{property.pendingRequests.length > 2 ? 's' : ''}
            </p>
          )}
        </div>
      )}

      {hasOpportunities && !hasPendingRequests && (
        <div className="mb-3 space-y-1.5">
          {property.expiringWarranties?.slice(0, 1).map((warranty) => (
            <div key={warranty.item} className="rounded-md bg-blue-400/10 border border-blue-400/20 px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-blue-300 text-xs">🛡️</span>
                  <span className="text-xs text-blue-200 truncate">{warranty.item} expiring</span>
                </div>
                <span className="text-xs text-blue-300/70 flex-shrink-0">{warranty.daysUntil}d</span>
              </div>
            </div>
          ))}
          {property.upcomingReminders?.slice(0, 1).map((reminder) => (
            <div key={reminder.title} className="rounded-md bg-blue-400/10 border border-blue-400/20 px-3 py-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-blue-300 text-xs">🔔</span>
                  <span className="text-xs text-blue-200 truncate">{reminder.title}</span>
                </div>
                <span className="text-xs text-blue-300/70 flex-shrink-0">{reminder.daysUntil}d</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {needsAttention && !hasPendingRequests && !hasOpportunities && (
        <div className="mb-3 rounded-md bg-yellow-400/10 border border-yellow-400/20 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-yellow-300 text-xs">💡</span>
            <span className="text-xs text-yellow-200">
              {property.daysSinceLastWork ? `${property.daysSinceLastWork} days since last contact` : 'No recent contact'}
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-white/60 mb-2">
        {property.verifiedWorkCount > 0 && (
          <span>✓ {property.verifiedWorkCount} verified</span>
        )}
        {property.daysSinceLastWork !== null && (
          <span>{property.daysSinceLastWork === 0 ? 'Today' : `${property.daysSinceLastWork}d ago`}</span>
        )}
        {property.totalSpent && property.totalSpent > 0 && (
          <span className="text-green-300">${property.totalSpent.toLocaleString()}</span>
        )}
      </div>

      {/* Last work */}
      {property.lastWorkTitle && (
        <div className={`text-xs ${textMeta} line-clamp-1`}>
          Recent: {property.lastWorkTitle}
        </div>
      )}
    </Link>
  );
}

function Chip({
  active,
  onClick,
  children,
  variant = "default",
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "default" | "orange" | "blue" | "yellow";
}) {
  const variantStyles = {
    default: active
      ? "border-white/40 bg-white/15 text-white"
      : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10",
    orange: active
      ? "border-orange-400/40 bg-orange-400/20 text-orange-200"
      : "border-orange-400/20 bg-orange-400/5 text-orange-300/80 hover:bg-orange-400/10",
    blue: active
      ? "border-blue-400/40 bg-blue-400/20 text-blue-200"
      : "border-blue-400/20 bg-blue-400/5 text-blue-300/80 hover:bg-blue-400/10",
    yellow: active
      ? "border-yellow-400/40 bg-yellow-400/20 text-yellow-200"
      : "border-yellow-400/20 bg-yellow-400/5 text-yellow-300/80 hover:bg-yellow-400/10",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${variantStyles[variant]}`}
    >
      {children}
    </button>
  );
}