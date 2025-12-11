// app/pro/contractor/service-records/[id]/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ServiceRecordDetailClient } from "./ServiceRecordDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

type AttachmentType = "photo" | "invoice" | "warranty" | "other";

function inferAttachmentType(
  url: string | null,
  filename: string,
  mimeType: string | null
): AttachmentType {
  const safeUrl = (url || "").toLowerCase();
  const lowerName = filename.toLowerCase();
  const safeMime = (mimeType || "").toLowerCase();

  if (safeUrl.includes("/invoice/") || lowerName.includes("invoice")) {
    return "invoice";
  }
  if (safeUrl.includes("/warranty/") || lowerName.includes("warranty")) {
    return "warranty";
  }
  if (safeMime.startsWith("image/")) {
    return "photo";
  }
  return "other";
}

export default async function ServiceRecordDetailPage({ params }: PageProps) {
  const { id: serviceId } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // verify contractor
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
    },
  });

  if (!serviceRecord) {
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
    // warranty metadata from the form / Prisma
    warrantyIncluded: serviceRecord.warrantyIncluded ?? false,
    warrantyLength: serviceRecord.warrantyLength ?? null,
    warrantyDetails: serviceRecord.warrantyDetails ?? null,
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
      type: inferAttachmentType(a.url, a.filename, a.mimeType),
    })),
    // these can be wired later from a dedicated reminders / warranties query
    reminders: [] as any[],
    warranties: [] as any[],
  };

  return (
    <main className="relative min-h-screen text-white">
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