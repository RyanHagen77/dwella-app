// app/pro/contractor/service-records/[id]/page.tsx
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { ServiceRecordDetailClient } from "./ServiceRecordDetailClient";
import { ServiceRecordActions } from "./ServiceRecordActions";

type PageProps = {
  params: { id: string };
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

  if (safeUrl.includes("/invoice/") || lowerName.includes("invoice")) return "invoice";
  if (safeUrl.includes("/warranty/") || lowerName.includes("warranty")) return "warranty";
  if (safeMime.startsWith("image/")) return "photo";
  return "other";
}

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ServiceRecordDetailPage({ params }: PageProps) {
  const serviceId = params.id;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  // verify contractor
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { proProfile: true },
  });

  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  // Fetch by PK; then enforce ownership in code
  const serviceRecord = await prisma.serviceRecord.findUnique({
    where: { id: serviceId },
    include: {
      home: {
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true, // BigInt in DB
        },
      },
      // If you later add reminders relation, include it here and map below
      // reminders: true,
    },
  });

  if (!serviceRecord || serviceRecord.contractorId !== userId) {
    notFound();
  }

  const addrLine = [
    serviceRecord.home.address,
    serviceRecord.home.city,
    serviceRecord.home.state,
    serviceRecord.home.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const homeownerName =
    serviceRecord.home.owner?.name || serviceRecord.home.owner?.email || "Unclaimed";

  // ✅ homeId is REQUIRED by the client type
  const detail = {
    id: serviceRecord.id,
    homeId: serviceRecord.homeId, // <-- FIX: include this

    serviceType: serviceRecord.serviceType,
    serviceDate: serviceRecord.serviceDate.toISOString(),
    description: serviceRecord.description ?? "",
    cost: serviceRecord.cost ? Number(serviceRecord.cost) : null,
    status: serviceRecord.status,
    isVerified: serviceRecord.isVerified ?? false,
    verifiedAt: serviceRecord.verifiedAt ? serviceRecord.verifiedAt.toISOString() : null,

    // Warranty metadata
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
      size: Number(a.size), // ✅ send number; client expects number
      type: inferAttachmentType(a.url, a.filename, a.mimeType),
    })),

    // ✅ matches ReminderPreview[] in the updated client
    reminders: [] as Array<{
      id: string;
      title: string;
      dueAt: string | null;
      note?: string | null;
      status?: string | null;
      createdAt?: string | null;
    }>,

    // not used by client right now; keep if you want, or remove
    warranties: [] as Array<{ id: string; item: string; expiresAt: string }>,
  };

  const isVerified = detail.isVerified;
  const statusLabel = isVerified ? "Verified" : "Pending";
  const statusTone = isVerified ? "text-emerald-200" : "text-yellow-300";
  const dotTone = isVerified ? "bg-emerald-400" : "bg-yellow-400";

  return (
    <main className="min-h-screen text-white">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/pro/contractor/dashboard" className="text-white/70 hover:text-white transition-colors">
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <Link href="/pro/contractor/service-records" className="text-white/70 hover:text-white transition-colors">
            Service Records
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white truncate max-w-[40%]">{detail.serviceType}</span>
        </nav>

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            {/* Left: back + title/meta */}
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Link
                href="/pro/contractor/service-records"
                className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to service records"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </Link>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${dotTone}`} />
                  <h1 className={`truncate text-2xl font-bold ${heading}`}>{detail.serviceType}</h1>
                </div>

                <p className={`mt-1 text-sm ${textMeta} truncate`}>{detail.addressLine}</p>

                <div className={`mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${textMeta}`}>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-white/60">👤</span>
                    <span className="truncate max-w-[18rem]">{homeownerName}</span>
                  </span>

                  <span className="inline-flex items-center gap-2">
                    <span className="text-white/60">📅</span>
                    <span>{formatShortDate(detail.serviceDate)}</span>
                  </span>

                  <span className={`inline-flex items-center gap-2 font-medium ${statusTone}`}>
                    <span>{statusLabel}</span>
                  </span>
                </div>

                {/* ✅ Actions under text on mobile, but can "float" right on desktop */}
                <div className="mt-3 flex flex-wrap items-center gap-2 sm:hidden">
                  <ServiceRecordActions
                    serviceRecordId={detail.id}
                    serviceRecord={{
                      id: detail.id,
                      serviceType: detail.serviceType,
                      serviceDate: detail.serviceDate.slice(0, 10),
                      description: detail.description,
                      cost: detail.cost,
                      status: detail.status,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ✅ Desktop: float actions to the right */}
            <div className="hidden flex-shrink-0 sm:flex sm:items-center sm:gap-2">
              <ServiceRecordActions
                serviceRecordId={detail.id}
                serviceRecord={{
                  id: detail.id,
                  serviceType: detail.serviceType,
                  serviceDate: detail.serviceDate.slice(0, 10),
                  description: detail.description,
                  cost: detail.cost,
                  status: detail.status,
                }}
              />
            </div>
          </div>
          </section>

        <ServiceRecordDetailClient record={detail} />
      </div>
    </main>
  );
}