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

export default async function ProDashboardPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") redirect("/login");
  if (!session.user.id) redirect("/login");

  const userId = session.user.id;
  const isPending = session.user.proStatus === "PENDING";

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

  // Pending view
  if (isPending) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="alert-glass p-8 text-center">
            <div className="mb-6 text-6xl">⏳</div>
            <h1 className="mb-4 heading text-3xl">Welcome to MyHomeDox Pro!</h1>
            <p className="mb-6 textMeta text-base">Your application is under review</p>

            <div className="mx-auto max-w-2xl glass p-6 text-left">
              <h2 className="mb-4 heading text-xl">What happens next?</h2>
              <ol className="space-y-3 textMeta">
                <li className="flex items-start">
                  <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100/20 text-xs font-semibold text-amber-300">1</span>
                  <span>We&apos;ll review your application within 1–2 business days</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100/20 text-xs font-semibold text-amber-300">2</span>
                  <span>You&apos;ll receive an email notification once approved</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100/20 text-xs font-semibold text-amber-300">3</span>
                  <span>After approval, invite clients, send quotes, and manage your business</span>
                </li>
              </ol>
            </div>

            <div className="mt-8">
              <h3 className="mb-4 heading text-lg">Your Application Details</h3>
              <div className="mx-auto max-w-2xl glass p-6 text-left">
                <div className="grid grid-cols-2 gap-4 textMeta">
                  <div>
                    <p className="text-white/60 font-medium">Name</p>
                    <p className="text-white">{session.user.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-medium">Email</p>
                    <p className="text-white">{session.user.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-medium">Business Name</p>
                    <p className="text-white">{proProfile?.businessName || "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-medium">Type</p>
                    <p className="text-white">{prettyType(proProfile?.type as ProKind | null)}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-medium">Phone</p>
                    <p className="text-white">{proProfile?.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-white/60 font-medium">License</p>
                    <p className="text-white">{proProfile?.licenseNo || "Not provided"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <Link href="/pro/profile" className="ctaGhost px-6 py-3 text-sm">Edit Profile</Link>
              <a href="mailto:support@myhomedox.com" className="ctaPrimary px-6 py-3 text-sm">Contact Support</a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Approved: load dashboard data from DB
  const connections = await prisma.connection.findMany({
    where: { contractorId: userId, status: "ACTIVE" },
    include: {
      homeowner: { select: { name: true, email: true } },
      home: { select: { address: true, city: true, state: true } },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
  });

  // Mock data
  const mockJobs = [
    { id: "j1", title: "AC Tune-up", clientAddress: "1842 Maple St", due: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: "scheduled", estAmount: 180 },
    { id: "j2", title: "Heat Pump Install Quote", clientAddress: "92 3rd Ave", due: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: "requested" },
  ];

  const mockRecords = [
    { id: "r1", title: "Furnace Repair", date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), address: "73 Oak Ct", amount: 420 },
    { id: "r2", title: "Mini-split Install", date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), address: "11 Lakeview Dr", amount: 3200 },
  ];

  const mockReviews = [
    { id: "rev1", author: "K. Santos", rating: 5, text: "On time, super clear, fair price.", date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
    { id: "rev2", author: "D. Patel", rating: 4, text: "Quick thermostat swap, works great.", date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
  ];

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="glass p-6">
            <p className="textMeta">Active Clients</p>
            <p className="mt-2 text-3xl font-bold text-white">{connections.length}</p>
          </div>
          <div className="glass p-6">
            <p className="textMeta">Active Jobs</p>
            <p className="mt-2 text-3xl font-bold text-white">{mockJobs.length}</p>
          </div>
          <div className="glass p-6">
            <p className="textMeta">This Month</p>
            <p className="mt-2 text-3xl font-bold text-white">$3,800</p>
          </div>
          <div className="glass p-6">
            <p className="textMeta">Avg Rating</p>
            <p className="mt-2 text-3xl font-bold text-white">{proProfile?.rating?.toFixed(1) || "—"} ★</p>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Active Jobs */}
            <div className="glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="heading text-xl">Active Jobs</h2>
                <Link href="/pro/jobs" className="ctaGhost text-sm px-3 py-1.5">View All</Link>
              </div>

              {mockJobs.length === 0 ? (
                <div className="py-8 textMeta text-center"><p>No active jobs</p></div>
              ) : (
                <div className="space-y-3">
                  {mockJobs.map((job) => (
                    <div key={job.id} className="glassTight p-4 hover:bg-white/10">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-white font-medium">{job.title}</h3>
                          <p className="textMeta">{job.clientAddress} • Due {new Date(job.due).toLocaleDateString()}</p>
                        </div>
                        {job.estAmount && <span className="pill pill--ok">${job.estAmount}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Jobs */}
            <div className="glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="heading text-xl">Recent Work</h2>
              </div>
              <div className="space-y-3">
                {mockRecords.map((record) => (
                  <div key={record.id} className="flex items-center justify-between border-b border-white/10 pb-3 last:border-0">
                    <div>
                      <p className="text-white font-medium">{record.title}</p>
                      <p className="textMeta">{new Date(record.date).toLocaleDateString()} • {record.address}</p>
                    </div>
                    <span className="text-white font-medium">${record.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            {/* Clients */}
            <div className="glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="heading text-xl">Clients</h2>
                <Link href="/pro/clients" className="ctaGhost text-sm px-3 py-1.5">View All</Link>
              </div>

              {connections.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="mb-4 textMeta">No clients yet</p>
                  <Link href="/pro/invite" className="ctaPrimary inline-block px-4 py-2 text-sm">Invite Your First Client</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {connections.map((conn) => (
                    <div key={conn.id} className="glassTight p-3">
                      <p className="text-white font-medium">{conn.homeowner?.name || "—"}</p>
                      <p className="textMeta">{conn.home?.address}{conn.home?.city ? `, ${conn.home.city}` : ""}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="glass p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="heading text-xl">Recent Reviews</h2>
              </div>
              <div className="space-y-4">
                {mockReviews.map((review) => (
                  <div key={review.id} className="border-b border-white/10 pb-4 last:border-0">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-white font-medium">{review.author}</span>
                      <span className="text-amber-300 text-sm">{review.rating} ★</span>
                    </div>
                    <p className="textMeta">{review.text}</p>
                    <p className="mt-1 text-[11px] text-white/50">{new Date(review.date).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass p-6">
              <h2 className="mb-4 heading text-xl">Quick Actions</h2>
              <div className="space-y-2">
                <Link href="/pro/invite" className="glassTight block p-3 text-center hover:bg-white/10">
                  <span className="text-2xl">📨</span>
                  <p className="mt-1 text-white font-medium text-sm">Invite Client</p>
                </Link>
                <Link href="/pro/profile" className="glassTight block p-3 text-center hover:bg-white/10">
                  <span className="text-2xl">⚙️</span>
                  <p className="mt-1 text-white font-medium text-sm">Edit Profile</p>
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