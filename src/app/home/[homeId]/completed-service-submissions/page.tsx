// app/home/[homeId]/completed-service-submissions/page.tsx
export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import { ServiceSubmissionStatus } from "@prisma/client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
import Link from "next/link";

import CompletedServiceSubmissionsClient from "./CompletedServiceSubmissionsClient";

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
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
      </svg>
    </Link>
  );
}

export default async function WorkPage({ params }: PageProps) {
  const { homeId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) notFound();
  await requireHomeAccess(homeId, session.user.id);

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: { id: true, address: true, city: true, state: true, zip: true },
  });
  if (!home) notFound();

  const homeAddress =
    `${home.address}` +
    `${home.city ? `, ${home.city}` : ""}` +
    `${home.state ? `, ${home.state}` : ""}` +
    `${home.zip ? ` ${home.zip}` : ""}`;

  // Connected contractors
  const connectionsRaw = await prisma.connection.findMany({
    where: { homeId, status: "ACTIVE" },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: {
            select: { businessName: true, company: true, phone: true, rating: true, verified: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Pending work submissions
  const pendingServiceRaw = await prisma.serviceRecord.findMany({
    where: {
      homeId,
      status: { in: [ServiceSubmissionStatus.DOCUMENTED, ServiceSubmissionStatus.DOCUMENTED_UNVERIFIED] },
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: { select: { businessName: true, company: true } },
        },
      },
      attachments: { select: { id: true, filename: true, url: true, mimeType: true, size: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Service requests
  const serviceRequestsRaw = await prisma.serviceRequest.findMany({
    where: { homeId, homeownerId: session.user.id },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: { select: { businessName: true, company: true, phone: true, verified: true, rating: true } },
        },
      },
      quote: { select: { id: true, totalAmount: true, status: true, expiresAt: true } },
      serviceRecord: { select: { id: true, status: true, serviceDate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Serialize
  const connections = connectionsRaw
    .filter((c) => c.contractor)
    .map((c) => ({
      id: c.id,
      contractor: c.contractor!,
      createdAt: c.createdAt.toISOString(),
    }));

  const pendingService = pendingServiceRaw
    .filter((s) => s.contractor)
    .map((s) => ({
      id: s.id,
      title: s.serviceType,
      description: s.description,
      serviceDate: s.serviceDate.toISOString(),
      cost: s.cost ? Number(s.cost) : null,
      createdAt: s.createdAt.toISOString(),
      contractor: s.contractor!,
      attachments: s.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mimeType: a.mimeType,
        size: Number(a.size),
        url: a.url,
      })),
    }));

  const serviceRequests = serviceRequestsRaw
    .filter((sr) => sr.contractor)
    .map((sr) => ({
      id: sr.id,
      title: sr.title,
      description: sr.description,
      category: sr.category,
      urgency: sr.urgency,
      budgetMin: sr.budgetMin ? Number(sr.budgetMin) : null,
      budgetMax: sr.budgetMax ? Number(sr.budgetMax) : null,
      desiredDate: sr.desiredDate?.toISOString() || null,
      status: sr.status,
      createdAt: sr.createdAt.toISOString(),
      updatedAt: sr.updatedAt.toISOString(),
      respondedAt: sr.respondedAt?.toISOString() || null,
      contractor: sr.contractor!,
      quote: sr.quote
        ? {
            id: sr.quote.id,
            totalAmount: Number(sr.quote.totalAmount),
            status: sr.quote.status,
            expiresAt: sr.quote.expiresAt?.toISOString() || null,
          }
        : null,
      serviceRecord: sr.serviceRecord
        ? {
            id: sr.serviceRecord.id,
            status: sr.serviceRecord.status,
            serviceDate: sr.serviceRecord.serviceDate.toISOString(),
          }
        : null,
    }));

  const backHref = `/home/${homeId}`;
  const breadcrumbItems = [{ label: homeAddress, href: backHref }, { label: "Requests & Submissions" }];

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <BackButton href={backHref} label="Back to home" />
              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl font-bold ${heading}`}>Requests &amp; Submissions</h1>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  {serviceRequests.length} active {serviceRequests.length === 1 ? "request" : "requests"} •{" "}
                  {pendingService.length} awaiting approval
                </p>
              </div>
            </div>

            <Link href={`/home/${homeId}/service-requests/new`} className={ctaPrimary}>
              + Request Service
            </Link>
          </div>
        </section>

        {/* ✅ Client content: NOT wrapped in glass (prevents washed stacking) */}
        <CompletedServiceSubmissionsClient
          homeId={homeId}
          homeAddress={homeAddress}
          connections={connections}
          pendingService={pendingService}
          serviceRequests={serviceRequests}
        />
      </div>
    </main>
  );
}