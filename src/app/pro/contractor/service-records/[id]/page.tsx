export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ServiceRecordDetailClient } from "./ServiceRecordDetailClient";

export default async function ServiceRecordDetailPage({
  params,
}: {
  params: Promise<{ serviceId: string }>;
}) {
  const { serviceId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Verify contractor role/type
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { proProfile: true },
  });
  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  const serviceRecord = await prisma.serviceRecord.findFirst({
    where: {
      id: serviceId,
      contractorId: userId,
    },
    include: {
      home: {
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
        },
      },

      // OPTIONAL relations – wire these once you add them to Prisma:
      // contractorReminders: true,
      // warranties: { include: { attachment: true } },
    },
  });

  if (!serviceRecord
  ) {
    notFound();
  }

  const addrLine = [
    serviceRecord.home.address,
    serviceRecord.home.city,
    serviceRecord.home.state,
  ]
    .filter(Boolean)
    .join(", ");

  const homeownerName =
    serviceRecord.home.owner?.name ||
    serviceRecord.home.owner?.email ||
    "Unclaimed";

  const detail = {
    id: serviceRecord.id,
    homeId: serviceRecord.homeId,
    serviceType: serviceRecord.serviceType,
    serviceDate: serviceRecord.serviceDate.toISOString(),
    description: serviceRecord.description ?? "",
    cost: serviceRecord.cost ? Number(serviceRecord.cost) : null,
    status: serviceRecord.status,
    isVerified: serviceRecord.isVerified ?? false,
    verifiedAt: serviceRecord.verifiedAt
      ? serviceRecord.verifiedAt.toISOString()
      : null,
    addressLine: addrLine,
    home: {
      id: serviceRecord.home.id,
      address: serviceRecord.home.address,
      city: serviceRecord.home.city,
      state: serviceRecord.home.state,
      zip: serviceRecord.home.zip,
      homeownerName,
    },
    attachments: serviceRecord.attachments.map((a) => ({
      id: a.id,
      filename: a.filename,
      url: a.url,
      mimeType: a.mimeType,
      size: Number(a.size),
    })),

    // If/when you add these relations, map them here:
    reminders: [], // filled client-side via props once you have contractorReminders
    warranties: [], // same for warranties
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 space-y-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/pro/contractor/dashboard"
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <Link
            href="/pro/contractor/service-records"
            className="text-white/70 hover:text-white transition-colors"
          >
            Service Records
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white truncate max-w-[40%]">
            {serviceRecord.serviceType}
          </span>
        </nav>

        <ServiceRecordDetailClient record={detail} />
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