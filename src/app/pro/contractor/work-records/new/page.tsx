// app/pro/contractor/work-records/new/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DocumentWorkClient } from "./DocumentWorkClient";
import Image from "next/image";

export default async function DocumentWorkPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Verify user is a contractor
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/dashboard");
  }

  // Get all ACTIVE work for this contractor
  const connections = await prisma.connection.findMany({
    where: {
      contractorId: session.user.id,
      status: "ACTIVE",
    },
    include: {
      home: true,
      homeowner: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      acceptedAt: "desc",
    },
  });

  const connectedHomes = connections.map((conn) => ({
    id: conn.home.id,
    address: conn.home.address,
    city: conn.home.city,
    state: conn.home.state,
    zip: conn.home.zip,
    ownerName: conn.homeowner.name,
  }));

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-4xl p-6">
        <DocumentWorkClient connectedHomes={connectedHomes} />
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