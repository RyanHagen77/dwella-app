// app/stats/[homeId]/service-requests/new/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { RequestServiceForm } from "../_components/RequestServiceForm";
import { NoContractorsCard } from "../_components/NoContractorsCard";
import Breadcrumb from "@/components/ui/Breadcrumb";

type PageProps = {
  params: Promise<{ homeId: string }>;
};

function BackButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 transition-colors hover:bg-white/15"
      aria-label={label}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
    </Link>
  );
}

export default async function RequestServicePage({ params }: PageProps) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) redirect("/login");
  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, address: true, city: true, state: true },
  });

  if (!home) redirect("/home");

  const homeAddress = [home.address, home.city, home.state].filter(Boolean).join(", ");

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
    orderBy: { lastServiceDate: "desc" },
  });

  const backHref = `/home/${homeId}/completed-service-submissions`;

  const breadcrumbItems = [
    { label: homeAddress, href: `/home/${homeId}` },
    { label: "Requests & Submissions", href: backHref },
    { label: "Request Service" },
  ];

  const hasConnections = connections.length > 0;

  return (
    <main className="relative min-h-screen text-white">
      <div className={`mx-auto space-y-6 p-6 ${hasConnections ? "max-w-4xl" : "max-w-7xl"}`}>
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <BackButton href={backHref} label="Back to requests" />

              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  {hasConnections ? "Request Service" : "Request Work"}
                </h1>

                <p className={`mt-1 text-sm ${textMeta}`}>
                  {hasConnections
                    ? `${connections.length} connected ${
                        connections.length === 1 ? "contractor" : "contractors"
                      }`
                    : "No connected contractors"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {hasConnections ? (
          <div className={glass}>
            <RequestServiceForm homeId={homeId} connections={connections} />
          </div>
        ) : (
          <NoContractorsCard homeId={homeId} homeAddress={homeAddress} />
        )}
      </div>
    </main>
  );
}