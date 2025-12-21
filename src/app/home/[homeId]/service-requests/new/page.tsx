// app/stats/[homeId]/service-requests/new/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requireHomeAccess } from "@/lib/authz";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";

import { RequestServiceForm } from "../_components/RequestServiceForm";
import { NoContractorsCard } from "../_components/NoContractorsCard";

type PageProps = {
  params: Promise<{ homeId: string }>;
};

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

  const hasConnections = connections.length > 0;

  const backHref = `/home/${homeId}/completed-service-submissions`;

  const breadcrumbItems = [
    { label: homeAddress, href: `/home/${homeId}` },
    { label: "Requests & Submissions", href: backHref },
    { label: hasConnections ? "Request Service" : "Request Work" },
  ];

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref={backHref}
          backLabel="Back to requests"
          title={hasConnections ? "Request Service" : "Request Work"}
          meta="Request work from a contractor you’re connected with"
        />

        {hasConnections ? (
          // ✅ Single layer body surface (no glass-on-glass)
          <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
            <RequestServiceForm homeId={homeId} connections={connections} />
          </section>
        ) : (
          <NoContractorsCard homeId={homeId} homeAddress={homeAddress} />
        )}
      </div>
    </main>
  );
}