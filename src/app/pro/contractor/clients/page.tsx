export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ConnectionStatus } from "@prisma/client";

import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
import ContractorClientsClient from "./ContractorClientsClient";
import { InviteHomeownerButton } from "@/app/pro/_components/InviteHomeownerButton";

type PageProps = {
  searchParams: Promise<{ search?: string; sort?: string; filter?: string }>;
};

type SortKey = "newest" | "oldest" | "name" | "recent";
type FilterKey = "all" | "pending" | "active";

export type ClientRow = {
  homeownerId: string;
  homeownerName: string;
  homeownerEmail: string | null;

  homesCount: number;
  homes: { homeId: string; addressLine: string }[];

  status: "Active" | "Pending"; // rollup label
  lastServiceDate: string | null; // ISO
  totalSpent: number; // rolled up
  createdAt: string; // first connection createdAt (earliest)
};

function addrLine(home: { address: string; city: string; state: string }) {
  return `${home.address}, ${home.city}, ${home.state}`;
}

export default async function ContractorClientsPage({ searchParams }: PageProps) {
  const { search, sort, filter } = await searchParams;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  const parsedFilter: FilterKey =
    filter === "pending" || filter === "active" ? filter : "all";

  const parsedSort: SortKey =
    sort === "oldest" || sort === "name" || sort === "recent" ? sort : "newest";

  const initialSearch = (search ?? "").trim() || undefined;

  /**
   * ✅ IMPORTANT:
   * Fetch ALL connections for correct counts (client handles filter/search/sort).
   * Exclude archived by BOTH archivedAt + status.
   */
  const connections = await prisma.connection.findMany({
    where: {
      contractorId: session.user.id,
      archivedAt: null,
      status: { not: ConnectionStatus.ARCHIVED },
    },
    include: {
      homeowner: { select: { id: true, name: true, email: true } },
      home: { select: { id: true, address: true, city: true, state: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by homeowner (1 row per homeowner)
  const byHomeowner = new Map<string, ClientRow>();

  for (const c of connections) {
    const key = c.homeowner.id;
    const existing = byHomeowner.get(key);

    const homeEntry = {
      homeId: c.home.id,
      addressLine: addrLine(c.home),
    };

    const spent = Number(c.totalSpent ?? 0);
    const lastServiceIso = c.lastServiceDate ? c.lastServiceDate.toISOString() : null;

    const isActive = c.status === ConnectionStatus.ACTIVE;

    if (!existing) {
      byHomeowner.set(key, {
        homeownerId: c.homeowner.id,
        homeownerName: c.homeowner.name || c.homeowner.email || "Homeowner",
        homeownerEmail: c.homeowner.email ?? null,

        homesCount: 1,
        homes: [homeEntry],

        status: isActive ? "Active" : "Pending",
        lastServiceDate: lastServiceIso,
        totalSpent: spent,
        createdAt: c.createdAt.toISOString(),
      });
      continue;
    }

    // merge
    if (!existing.homes.some((h) => h.homeId === homeEntry.homeId)) {
      existing.homes.push(homeEntry);
      existing.homesCount = existing.homes.length;
    }

    // rollup status: Active wins if any connection is active
    if (isActive) existing.status = "Active";

    // rollup spent
    existing.totalSpent += spent;

    // rollup lastServiceDate (max)
    if (lastServiceIso) {
      if (!existing.lastServiceDate) existing.lastServiceDate = lastServiceIso;
      else {
        const prev = new Date(existing.lastServiceDate).getTime();
        const next = new Date(lastServiceIso).getTime();
        if (next > prev) existing.lastServiceDate = lastServiceIso;
      }
    }

    // earliest createdAt (min)
    const cur = new Date(existing.createdAt).getTime();
    const cand = c.createdAt.getTime();
    if (cand < cur) existing.createdAt = c.createdAt.toISOString();
  }

  const rows = Array.from(byHomeowner.values());

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Clients</span>
        </nav>

        {/* Clean header (no icon blocks) */}
        <section className={glass}>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>Clients</h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                Homeowners you’re connected with on MyDwella.
              </p>
              <p className={`mt-1 text-xs ${textMeta}`}>{rows.length} clients</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <Link href="/pro/contractor/clients/new" className={ctaPrimary}>
                + Add Client
              </Link>
              <InviteHomeownerButton />
            </div>
          </div>
        </section>

        <ContractorClientsClient
          clients={rows}
          initialSearch={initialSearch}
          initialSort={parsedSort}
          initialFilter={parsedFilter}
        />
      </div>
    </main>
  );
}