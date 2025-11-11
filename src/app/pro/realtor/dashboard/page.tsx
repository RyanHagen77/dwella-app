export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type ProKind = "CONTRACTOR" | "REALTOR" | "INSPECTOR";

function prettyType(t?: ProKind | null) {
  if (!t) return "—";
  return t.charAt(0) + t.slice(1).toLowerCase();
}

export default async function RealtorDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") redirect("/login");
  if (!session.user.id) redirect("/login");

  const userId = session.user.id as string;

  const proProfile = await prisma.proProfile.findUnique({
    where: { userId },
    select: {
      businessName: true,
      type: true,
      phone: true,
      licenseNo: true,
      verified: true,
      rating: true,
    },
  });

  // Mock data for realtors
  const mockListings = [
    { id: "l1", address: "123 Oak Ave", status: "Active", price: 450000, days: 15 },
    { id: "l2", address: "456 Maple St", status: "Pending", price: 380000, days: 42 },
  ];

  const mockClients = [
    { id: "c1", name: "Sarah Johnson", type: "Buyer", status: "Active" },
    { id: "c2", name: "Mike Chen", type: "Seller", status: "Under Contract" },
  ];

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="glass p-6">
            <p className="textMeta">Active Listings</p>
            <p className="mt-2 text-3xl font-bold text-white">{mockListings.length}</p>
          </div>
          <div className="glass p-6">
            <p className="textMeta">Active Clients</p>
            <p className="mt-2 text-3xl font-bold text-white">{mockClients.length}</p>
          </div>
          <div className="glass p-6">
            <p className="textMeta">This Month Volume</p>
            <p className="mt-2 text-3xl font-bold text-white">$830K</p>
          </div>
          <div className="glass p-6">
            <p className="textMeta">Avg Rating</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {proProfile?.rating?.toFixed(1) || "—"} ★
            </p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column - Listings */}
          <div className="space-y-6 lg:col-span-2">
            <div className="glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="heading text-xl">Active Listings</h2>
                <Link href="/pro/realtor/listings" className="ctaGhost text-sm px-3 py-1.5">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {mockListings.map((listing) => (
                  <div key={listing.id} className="glassTight p-4 hover:bg-white/10">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-medium">{listing.address}</h3>
                        <p className="textMeta">{listing.status} • {listing.days} days on market</p>
                      </div>
                      <span className="pill pill--ok">${(listing.price / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column - Clients */}
          <div className="space-y-6">
            <div className="glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="heading text-xl">Clients</h2>
                <Link href="/pro/realtor/clients" className="ctaGhost text-sm px-3 py-1.5">
                  View All
                </Link>
              </div>

              <div className="space-y-3">
                {mockClients.map((client) => (
                  <div key={client.id} className="glassTight p-3">
                    <p className="text-white font-medium">{client.name}</p>
                    <p className="textMeta">{client.type} • {client.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass p-6">
              <h2 className="mb-4 heading text-xl">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/pro/realtor/listings/new" className="glassTight block p-3 text-center hover:bg-white/10">
                  <span className="text-2xl">🏠</span>
                  <p className="mt-1 text-white font-medium text-sm">Add Listing</p>
                </Link>
                <Link href="/pro/invite" className="glassTight block p-3 text-center hover:bg-white/10">
                  <span className="text-2xl">📨</span>
                  <p className="mt-1 text-white font-medium text-sm">Invite Client</p>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="h-12" />
      </div>
    </main>
  );
}

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover md:object-[50%_35%] lg:object-[50%_30%]"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6))]" />
    </div>
  );
}