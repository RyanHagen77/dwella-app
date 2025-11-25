// app/home/[homeId]/job-requests/new/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta } from "@/lib/glass";
import { RequestWorkForm } from "../_components/RequestWorkForm";
import Breadcrumb from "@/components/ui/Breadcrumb";


type PageProps = {
  params: Promise<{ homeId: string }>;
};

export default async function RequestWorkPage({ params }: PageProps) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  await requireHomeAccess(homeId, session.user.id);

  // Get home details
  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
    },
  });

  if (!home) {
    redirect("/home");
  }

  const homeAddress = [home.address, home.city, home.state]
    .filter(Boolean)
    .join(", ");

  // Get active connections with contractors – ONLY select fields needed by RequestWorkForm
  const connections = await prisma.connection.findMany({
    where: {
      homeId,
      homeownerId: session.user.id,
      status: "ACTIVE",
      contractorId: { not: null },
    },
    select: {
      id: true,
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: {
              businessName: true,
              company: true,
              phone: true,
              verified: true,
              rating: true,
              specialties: true,
            },
          },
        },
      },
    },
    orderBy: {
      lastWorkDate: "desc", // can order by this even if it's not selected
    },
  });

  if (connections.length === 0) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: homeAddress, href: `/home/${homeId}` },
              { label: "Requests & Submissions", href: `/home/${homeId}/completed-work-submissions` },
              { label: "Request Work" },
            ]}
          />
          {/* Header */}
          <section className={glass}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Link
                  href={`/home/${homeId}/completed-work-submissions`}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                  aria-label="Back to requests"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                  </svg>
                </Link>
                <div className="flex-1 min-w-0">
                  <h1 className={`text-2xl font-bold ${heading}`}>Request Work</h1>
                  <p className={`text-sm ${textMeta} mt-1`}>
                    No connected contractors
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className={`${glass} text-center`}>
            <div className="mb-4 text-6xl">🔨</div>
            <h2 className="mb-2 text-xl font-semibold">No Connected Contractors</h2>
            <p className={`mb-6 ${textMeta}`}>
              You need to connect with a contractor before you can request work.
            </p>
            <Link
              href={`/home/${homeId}/contractors/find`}
              className="inline-block rounded-lg bg-[rgba(243,90,31,0.85)] px-6 py-3 font-medium text-white hover:bg-[rgba(243,90,31,0.95)]"
            >
              Find Contractors
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: homeAddress, href: `/home/${homeId}` },
            { label: "Requests & Submissions", href: `/home/${homeId}/completed-work-submissions` },
            { label: "Request Work" },
          ]}
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={`/home/${homeId}/completed-work-submissions`}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to requests"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
              </Link>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Request Work
                </h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {connections.length} connected {connections.length === 1 ? "contractor" : "contractors"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Form */}
        <div className={glass}>
          <RequestWorkForm
            homeId={homeId}
            connections={connections}
          />
        </div>
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
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}