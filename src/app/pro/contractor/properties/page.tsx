export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Image from "next/image";
import { PropertiesClient } from "./PropertiesClient";

export default async function PropertiesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user || session.user.role !== "PRO") {
    redirect("/login");
  }

  const userId = session.user.id as string;

  // Get all work for this contractor
  const connections = await prisma.connection.findMany({
    where: {
      contractorId: userId,
    },
    include: {
      homeowner: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  // Get homes separately
  const homeIds = connections.map(c => c.homeId);
  const homes = await prisma.home.findMany({
    where: {
      id: { in: homeIds },
    },
    select: {
      id: true,
      address: true,
      city: true,
      state: true,
      zip: true,
      photos: true,
    },
  });

  // Get work-records-records records for these homes
  const workRecords = await prisma.workRecord.findMany({
    where: {
      contractorId: userId,
      homeId: { in: homeIds },
    },
    select: {
      id: true,
      homeId: true,
      workDate: true,
      status: true,
      description: true,
    },
    orderBy: {
      workDate: "desc",
    },
  });

  // Transform data for client
  const properties = connections.map((conn) => {
    const home = homes.find(h => h.id === conn.homeId);
    const records = workRecords.filter((r) => r.homeId === conn.homeId);
    const lastWork = records.length > 0 ? records[0] : null;

    return {
      id: conn.homeId,
      address: home?.address ?? "Unknown Address",
      city: home?.city ?? "",
      state: home?.state ?? "",
      zip: home?.zip ?? "",
      homeownerName: conn.homeowner?.name ?? "Unknown",
      homeownerEmail: conn.homeowner?.email ?? "",
      connectionStatus: conn.status,
      jobCount: records.length,
      lastWorkDate: lastWork?.workDate?.toISOString() ?? null,
      lastWorkTitle: lastWork?.description ?? null,
      imageUrl: home?.photos?.[0] ?? null,
    };
  });

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-7xl p-6">
        <PropertiesClient properties={properties} />
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