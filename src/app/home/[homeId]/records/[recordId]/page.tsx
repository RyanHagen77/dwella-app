import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { requireHomeAccess } from "@/lib/authz";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { RecordActions } from "./_components/RecordActions";
import Breadcrumb from "@/components/ui/Breadcrumb";

type PageProps = {
  params: Promise<{
    homeId: string;
    recordId: string;
  }>;
};

export default async function RecordDetailPage({ params }: PageProps) {
  const { homeId, recordId } = await params;
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) notFound();
  await requireHomeAccess(homeId, session.user.id);

  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: {
      attachments: {
        select: {
          id: true,
          filename: true,
          url: true,
          mimeType: true,
          size: true,
          createdAt: true,
        },
      },
    },
  });

  if (!record || record.homeId !== homeId) notFound();

  const home = await prisma.home.findUnique({
    where: { id: homeId },
    select: {
      address: true,
      city: true,
      state: true,
      zip: true,
    },
  });

  if (!home) notFound();

  const addrLine = `${home.address}${
    home.city ? `, ${home.city}` : ""
  }${home.state ? `, ${home.state}` : ""}${home.zip ? ` ${home.zip}` : ""}`;

  // Serialize for client component
  const serializedRecord = {
    id: record.id,
    title: record.title,
    date: record.date,
    kind: record.kind,
    vendor: record.vendor,
    cost: record.cost != null ? Number(record.cost) : null,
    note: record.note,
  };

  const imageAttachments = record.attachments.filter((a) =>
    a.mimeType?.startsWith("image/")
  );
  const docAttachments = record.attachments.filter(
    (a) => !a.mimeType?.startsWith("image/")
  );

  const hasMeta =
    (record.date && record.date instanceof Date) ||
    typeof record.date === "string" ||
    record.vendor;

  const dateLabel = record.date
    ? new Date(record.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <main className="relative min-h-screen text-white">
      {/* Background */}
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

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}

        <Breadcrumb
          items={[
            { label: addrLine, href: `/home/${homeId}` },
            { label: "Maintenance & Repairs", href: `/home/${homeId}/records` },
            { label: record.title }, // current page
          ]}
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-3">
                <Link
                  href={`/home/${homeId}/records`}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                  aria-label="Back to maintenance & repairs"
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
                      d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                    />
                  </svg>
                </Link>
                <h1
                  className={`truncate text-2xl font-bold ${heading}`}
                >
                  {record.title}
                </h1>
              </div>

              {record.kind && (
                <div className="mb-2">
                  <span className="inline-flex items-center rounded-full bg-blue-400/20 px-3 py-1 text-sm font-medium text-blue-300">
                    {record.kind}
                  </span>
                </div>
              )}

              {hasMeta && (
                <p className={`text-sm ${textMeta}`}>
                  {dateLabel && <>📅 {dateLabel}</>}
                  {dateLabel && record.vendor && " • "}
                  {record.vendor && <>🔧 {record.vendor}</>}
                </p>
              )}
            </div>

            {/* Actions */}
            <RecordActions
              recordId={recordId}
              homeId={homeId}
              record={serializedRecord}
            />
          </div>
        </section>

        {/* Details */}
        <section className={glass}>
          <div className="space-y-4">
            {/* Date, Vendor, Cost */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {record.date && (
                <div>
                  <p className={`text-sm ${textMeta}`}>Date</p>
                  <p className="font-medium text-white">
                    {new Date(record.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
              {record.vendor && (
                <div>
                  <p className={`text-sm ${textMeta}`}>Vendor</p>
                  <p className="font-medium text-white">
                    {record.vendor}
                  </p>
                </div>
              )}
              {record.cost != null && (
                <div>
                  <p className={`text-sm ${textMeta}`}>Cost</p>
                  <p className="text-lg font-bold text-green-300">
                    ${Number(record.cost).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {record.note && (
              <div>
                <p className={`mb-2 text-sm ${textMeta}`}>Notes</p>
                <p className="whitespace-pre-wrap text-white/90">
                  {record.note}
                </p>
              </div>
            )}

            {/* Verified Info */}
            {record.verifiedBy && record.verifiedAt && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-3">
                <p className="text-sm text-green-300">
                  ✓ Verified on{" "}
                  {new Date(record.verifiedAt).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Attachments */}
        {record.attachments.length > 0 && (
          <section className={glass}>
            <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
              Attachments ({record.attachments.length})
            </h2>

            {/* Photos */}
            {imageAttachments.length > 0 && (
              <div className="mb-6">
                <h3
                  className={`mb-3 text-sm font-medium ${textMeta}`}
                >
                  Photos
                </h3>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {imageAttachments.map((attachment) => {
                    const href = `/api/home/${homeId}/attachments/${attachment.id}`;

                    return (
                      <a
                        key={attachment.id}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                      >
                        <Image
                          src={href}
                          alt={attachment.filename}
                          fill
                          className="object-cover transition-opacity"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
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
                    );
                  })}
                </div>
              </div>
            )}

            {/* Documents */}
            {docAttachments.length > 0 && (
              <div>
                <h3
                  className={`mb-3 text-sm font-medium ${textMeta}`}
                >
                  Documents
                </h3>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {docAttachments.map((attachment) => {
                    const href = `/api/home/${homeId}/attachments/${attachment.id}`;

                    return (
                      <a
                        key={attachment.id}
                        href={href}
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
                            {(
                              Number(attachment.size) / 1024
                            ).toFixed(1)}{" "}
                            KB
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
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        <div className="h-12" />
      </div>
    </main>
  );
}