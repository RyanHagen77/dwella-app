"use client";

import { useMemo, useState } from "react";
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
  connectionStatus: string;
  jobCount: number;
  lastWorkDate: string | null;
  lastWorkTitle: string | null;
  imageUrl: string | null;
};

type PropertiesClientProps = {
  properties: Property[];
};

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "past">("all");

  const counts = useMemo(
    () => ({
      all: properties.length,
      active: properties.filter((p) => p.connectionStatus === "ACTIVE").length,
      past: properties.filter((p) => p.connectionStatus !== "ACTIVE").length,
    }),
    [properties]
  );

  const filtered = useMemo(() => {
    let list = properties;

    // Filter by status
    if (filter === "active") {
      list = list.filter((p) => p.connectionStatus === "ACTIVE");
    } else if (filter === "past") {
      list = list.filter((p) => p.connectionStatus !== "ACTIVE");
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

    return list;
  }, [properties, filter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <section className={glass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All ({counts.all})
            </Chip>
            <Chip
              active={filter === "active"}
              onClick={() => setFilter("active")}
            >
              Active Clients ({counts.active})
            </Chip>
            <Chip
              active={filter === "past"}
              onClick={() => setFilter("past")}
            >
              Past Work ({counts.past})
            </Chip>
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search properties..."
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
            <div className="mb-4 text-5xl">🏠</div>
            <p className="mb-2 text-lg text-white">No properties found</p>
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
  const cityState = [property.city, property.state].filter(Boolean).join(", ");

  return (
    <Link
      href={`/pro/contractor/properties/${property.id}`}
      className={`${glass} group block transition hover:bg-white/15`}
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

      {/* Property Info */}
      <div>
        <h3 className={`mb-1 font-semibold ${heading} line-clamp-1`}>
          {property.address}
        </h3>
        <p className={`mb-3 text-sm ${textMeta}`}>{cityState}</p>

        <div className={`mb-3 text-sm ${textMeta}`}>
          <p>👤 {property.homeownerName}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <div className={`text-sm ${textMeta}`}>
            <span className="font-medium text-white">{property.jobCount}</span>{" "}
            job{property.jobCount !== 1 ? "s" : ""}
          </div>
          {property.lastWorkDate && (
            <div className={`text-xs ${textMeta}`}>
              Last: {new Date(property.lastWorkDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {property.lastWorkTitle && (
          <div className={`mt-2 text-xs ${textMeta} line-clamp-1`}>
            Recent: {property.lastWorkTitle}
          </div>
        )}
      </div>
    </Link>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-white/40 bg-white/15 text-white"
          : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}