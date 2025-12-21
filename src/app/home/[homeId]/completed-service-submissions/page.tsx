export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import { ServiceSubmissionStatus } from "@prisma/client";

import Breadcrumb from "@/components/ui/Breadcrumb";
import Link from "next/link";
import { ctaPrimary } from "@/lib/glass";

import CompletedServiceSubmissionsClient from "./CompletedServiceSubmissionsClient";
import { PageHeader } from "@/components/ui/PageHeader";

type PageProps = { params: Promise<{ homeId: string }> };

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

  const connections = connectionsRaw
    .filter((c) => c.contractor)
    .map((c) => ({ id: c.id, contractor: c.contractor!, createdAt: c.createdAt.toISOString() }));

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
  const requestHref = `/home/${homeId}/service-requests/new`;

  const breadcrumbItems = [{ label: homeAddress, href: backHref }, { label: "Requests & Submissions" }];

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref={backHref}
          backLabel="Back to home"
          title="Requests & Submissions"
          meta={
            <>
              {serviceRequests.length} active {serviceRequests.length === 1 ? "request" : "requests"} •{" "}
              {pendingService.length} awaiting approval
            </>
          }
          rightDesktop={
            <Link href={requestHref} className={ctaPrimary}>
              + Request Service
            </Link>
          }
        />

        {/* ✅ NOT glass: avoids “washed / double layer / hover slab” */}
        <CompletedServiceSubmissionsClient
          homeId={homeId}
          requestHref={requestHref}
          pendingService={pendingService}
          serviceRequests={serviceRequests}
        />
      </div>
    </main>
  );
}