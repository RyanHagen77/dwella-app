// app/pro/contractor/document-completed-work-submissions-records/[workId]/page.tsx

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta } from "@/lib/glass";
import { WorkRecordActions } from "./WorkRecordActions";

export default async function WorkRecordDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Optional: verify contractor role/type if you want consistency with other pro pages
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { proProfile: true },
  });
  if (user?.role !== "PRO" || user.proProfile?.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  const workRecord = await prisma.workRecord.findFirst({
    where: {
      id,
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

  if (!workRecord) {
    redirect("/pro/contractor/work-records");
  }

  const addrLine = [
    workRecord.home.address,
    workRecord.home.city,
    workRecord.home.state,
  ]
    .filter(Boolean)
    .join(", ");

  const serializedWorkRecord = {
    id: workRecord.id,
    homeId: workRecord.homeId,
    workType: workRecord.workType,
    workDate: workRecord.workDate.toISOString(),
    description: workRecord.description ?? "",
    cost: workRecord.cost ? Number(workRecord.cost) : null,
    status: workRecord.status,
  };

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-6xl space-y-6 p-6">
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
            href="/pro/contractor/work-records"
            className="text-white/70 hover:text-white transition-colors"
          >
            Work Records
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white truncate max-w-[40%]">
            {workRecord.workType}
          </span>
        </nav>

        {/* Header w/ back arrow */}
        <section className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href="/pro/contractor/work-records"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to work records"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>

              <div className="min-w-0">
                <h1 className={`text-2xl font-bold ${heading} truncate`}>
                  {workRecord.workType}
                </h1>
                <p className={`mt-1 text-sm ${textMeta}`}>
                  {new Date(workRecord.workDate).toLocaleDateString()}
                </p>
                {addrLine && (
                  <p className={`mt-1 text-xs ${textMeta} truncate`}>
                    {addrLine}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={workRecord.status} />
              <WorkRecordActions
                workRecordId={id}
                workRecord={serializedWorkRecord}
              />
            </div>
          </div>
        </section>

        {/* Details */}
        <section className={glass}>
          <div className="space-y-4">
            {/* Property info */}
            <div>
              <h3 className="text-sm font-medium text-white/70">Property</h3>
              <p className="text-white">{workRecord.home.address}</p>
              <p className={textMeta}>
                {workRecord.home.city}, {workRecord.home.state}{" "}
                {workRecord.home.zip}
              </p>
              {workRecord.home.owner && (
                <p className={`mt-1 ${textMeta}`}>
                  Owner:{" "}
                  {workRecord.home.owner.name || workRecord.home.owner.email}
                </p>
              )}
            </div>

            {/* Description */}
            {workRecord.description && (
              <div>
                <h3 className="text-sm font-medium text-white/70">
                  Description
                </h3>
                <p className="text-white whitespace-pre-wrap">
                  {workRecord.description}
                </p>
              </div>
            )}

            {/* Cost */}
            {workRecord.cost && (
              <div>
                <h3 className="text-sm font-medium text-white/70">Cost</h3>
                <p className="text-xl font-semibold text-white">
                  ${Number(workRecord.cost).toFixed(2)}
                </p>
              </div>
            )}

            {/* Attachments from DB */}
            {workRecord.attachments.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-medium text-white/70">
                  Attachments ({workRecord.attachments.length})
                </h3>

                {/* Photos */}
                {workRecord.attachments.some((a) =>
                  a.mimeType?.startsWith("image/")
                ) && (
                  <div className="mb-6">
                    <h4 className={`mb-3 text-sm font-medium ${textMeta}`}>
                      Photos
                    </h4>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {workRecord.attachments
                        .filter((a) => a.mimeType?.startsWith("image/"))
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${workRecord.homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:opacity-90"
                          >
                            <img
                              src={`/api/home/${workRecord.homeId}/attachments/${attachment.id}`}
                              alt={attachment.filename}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                                className="h-8 w-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                                />
                              </svg>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {workRecord.attachments.some(
                  (a) => !a.mimeType?.startsWith("image/")
                ) && (
                  <div>
                    <h4 className={`mb-3 text-sm font-medium ${textMeta}`}>
                      Documents
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {workRecord.attachments
                        .filter((a) => !a.mimeType?.startsWith("image/"))
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${workRecord.homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
                          >
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white/10">
                              {attachment.mimeType?.includes("pdf") ? (
                                <span className="text-xl">📄</span>
                              ) : (
                                <span className="text-xl">📎</span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-white">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-white/60">
                                {(Number(attachment.size) / 1024).toFixed(1)} KB
                              </p>
                            </div>
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                              className="h-5 w-5 text-white/50"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Warranty details */}
            {workRecord.warrantyIncluded && (
              <div>
                <h3 className="text-sm font-medium text-white/70">Warranty</h3>
                <div className="text-white">
                  {workRecord.warrantyLength && (
                    <p className="text-sm">
                      Length: {workRecord.warrantyLength}
                    </p>
                  )}
                  {workRecord.warrantyDetails && (
                    <p className="mt-1 text-sm">
                      {workRecord.warrantyDetails}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Status section */}
        <section className={glass}>
          <h3 className="mb-2 text-lg font-semibold text-white">Status</h3>
          {workRecord.isVerified ? (
            <div className="text-green-400">
              ✓ Verified by homeowner
              {workRecord.verifiedAt && (
                <span className="ml-2 text-sm text-white/60">
                  on{" "}
                  {new Date(workRecord.verifiedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          ) : (
            <div className="text-yellow-400">
              ⏳ Pending homeowner verification
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string }> = {
    DOCUMENTED_UNVERIFIED: {
      label: "Pending Verification",
      color: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
    },
    VERIFIED: {
      label: "Verified",
      color: "bg-green-400/10 text-green-300 border-green-400/30",
    },
    DISPUTED: {
      label: "Disputed",
      color: "bg-red-400/10 text-red-300 border-red-400/30",
    },
  };

  const { label, color } = config[status] || {
    label: status,
    color: "bg-gray-400/10 text-gray-300 border-gray-400/30",
  };

  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${color}`}>
      {label}
    </span>
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