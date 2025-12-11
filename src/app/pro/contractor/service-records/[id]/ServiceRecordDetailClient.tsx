"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  glass,
  glassTight,
  heading,
  textMeta,
  ctaGhost,
} from "@/lib/glass";
import { ServiceRecordActions } from "./ServiceRecordActions";
import ContractorReminderModal from "@/app/pro/contractor/reminders/ContractorReminderModal";
import type { ContractorReminderDTO } from "@/app/pro/contractor/reminders/ContractorRemindersClient";

type AttachmentType = "photo" | "invoice" | "warranty" | "other";

type AttachmentDTO = {
  id: string;
  filename: string;
  url: string | null;
  mimeType: string | null;
  size: number;
  type?: AttachmentType;
};

type WarrantyDTO = {
  id: string;
  title: string;
  description: string | null;
  coverageTerm: string | null;
  createdAt: string;
  acceptedAt: string | null;
  attachment: { id: string; filename: string; url: string | null };
};

type ServiceRecordDetail = {
  id: string;
  homeId: string;
  serviceType: string;
  serviceDate: string;
  description: string;
  cost: number | null;
  status: string;
  isVerified: boolean;
  verifiedAt: string | null;
  addressLine: string;
  // warranty metadata from creation form
  warrantyIncluded: boolean;
  warrantyLength: string | null;
  warrantyDetails: string | null;
  home: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
    homeownerName: string;
  };
  attachments: AttachmentDTO[];
  reminders?: ContractorReminderDTO[];
  warranties?: WarrantyDTO[];
};

type Props = {
  record: ServiceRecordDetail;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ServiceRecordDetailClient({ record }: Props) {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminders, setReminders] = useState<ContractorReminderDTO[]>(
    record.reminders || []
  );
  const [warranties, setWarranties] = useState<WarrantyDTO[]>(
    record.warranties || []
  );
  const [uploadingWarranty, setUploadingWarranty] = useState(false);

  const serializedServiceRecord = {
    id: record.id,
    serviceType: record.serviceType,
    serviceDate: record.serviceDate.slice(0, 10),
    description: record.description,
    cost: record.cost,
    status: record.status,
  };

  function onReminderSaved(saved: ContractorReminderDTO) {
    setReminders((prev) => {
      const idx = prev.findIndex((r) => r.id === saved.id);
      if (idx === -1) return [...prev, saved];
      const clone = [...prev];
      clone[idx] = saved;
      return clone;
    });
    setReminderModalOpen(false);
  }

  async function handleWarrantyFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingWarranty(true);

      // 1. get presign (generic attachments presign)
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // we only need storage here – homeId/recordId wiring happens in the backend
          homeId: record.homeId,
          recordId: record.id,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        }),
      });
      if (!presignRes.ok) throw new Error("Failed to get upload URL");
      const { url, key, publicUrl } = await presignRes.json();

      // 2. upload to S3
      const putRes = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Failed to upload warranty");

      // 3. store attachment metadata
      const attachRes = await fetch("/api/attachments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          size: file.size,
          contentType: file.type,
          storageKey: key,
          url: publicUrl,
        }),
      });

      if (!attachRes.ok) throw new Error("Failed to save attachment");
      const attachJson = await attachRes.json();
      const attachmentId = attachJson.attachment.id as string;

      // 4. attach to this service record (work record)
      const warrantyRes = await fetch(
        `/api/pro/contractor/service-records/${record.id}/warranty`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attachmentId,
            title: `${record.serviceType} warranty`,
            description: record.warrantyDetails,
            coverageTerm: record.warrantyLength,
          }),
        }
      );

      if (!warrantyRes.ok) throw new Error("Failed to attach warranty");
      const { warranty } = await warrantyRes.json();

      setWarranties((prev) => [...prev, warranty]);
    } catch (err) {
      console.error(err);
      alert("Something went wrong attaching the warranty.");
    } finally {
      setUploadingWarranty(false);
      e.target.value = "";
    }
  }

  // attachment categorisation
  const photos = record.attachments.filter(
    (a) => a.type === "photo" || a.mimeType?.startsWith("image/")
  );
  const invoices = record.attachments.filter((a) => a.type === "invoice");
  const warrantyFiles = record.attachments.filter((a) => a.type === "warranty");
  const otherDocs = record.attachments.filter(
    (a) =>
      (a.type === "other" || !a.type) && !a.mimeType?.startsWith("image/")
  );

  return (
    <>
      {/* Top header card */}
      <section className={glass + " rounded-2xl px-4 py-4 sm:px-6 sm:py-4"}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: back + title */}
          <div className="flex items-start gap-3">
            <Link
              href="/pro/contractor/service-records"
              className="mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 hover:bg-white/15"
              aria-label="Back to service records"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                fill="none"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>

            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${heading} truncate`}>
                {record.serviceType}
              </h1>
              <p className={`mt-1 text-sm ${textMeta}`}>
                {formatDate(record.serviceDate)}
              </p>
              {record.addressLine && (
                <p className={`mt-1 text-xs ${textMeta} truncate`}>
                  {record.addressLine}
                </p>
              )}
            </div>
          </div>

          {/* Right: status + actions */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={record.status} isVerified={record.isVerified} />
            <ServiceRecordActions
              serviceRecordId={record.id}
              serviceRecord={serializedServiceRecord}
            />
          </div>
        </div>
      </section>

      {/* Main grid */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
        {/* Left column: property, description, attachments */}
        <section className={glass + " rounded-2xl p-4 sm:p-5 space-y-5"}>
          {/* Property */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
              Property
            </h2>
            <p className="mt-1 text-sm font-medium text-white">
              {record.home.address}
            </p>
            <p className="text-sm text-white/80">
              {record.home.city}, {record.home.state} {record.home.zip}
            </p>
            <p className={textMeta + " mt-1 text-xs"}>
              Owner: {record.home.homeownerName}
            </p>
          </div>

          {/* Description + cost */}
          <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Service description
              </h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-white/80">
                {record.description || "No description provided."}
              </p>
            </div>
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-white/60">
                Service cost
              </h2>
              <p className="mt-1 text-lg font-semibold text-white">
                {record.cost != null
                  ? `$${record.cost.toFixed(2)}`
                  : "Not provided"}
              </p>
              <p className={textMeta + " mt-1 text-xs"}>
                Documented on {formatDate(record.serviceDate)}
              </p>
            </div>
          </div>

          {/* Attachments */}
          {(record.attachments?.length ?? 0) > 0 && (
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/60">
                Attachments ({record.attachments.length})
              </h2>

              {/* Photos */}
              {photos.length > 0 && (
                <div className="mb-6">
                  <h3 className={`mb-3 text-sm font-medium ${textMeta}`}>
                    Photos
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {photos.map((attachment) => {
                      const src = `/api/home/${record.homeId}/attachments/${attachment.id}`;
                      return (
                        <a
                          key={attachment.id}
                          href={src}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:opacity-90"
                        >
                          <div className="relative h-full w-full">
                            <Image
                              src={src}
                              alt={attachment.filename}
                              fill
                              sizes="(min-width: 640px) 33vw, 50vw"
                              className="object-cover transition group-hover:scale-105"
                            />
                          </div>
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoice documents */}
              {invoices.length > 0 && (
                <div className="mb-4">
                  <h3 className={`mb-2 text-sm font-medium ${textMeta}`}>
                    Invoice
                  </h3>
                  {invoices.map((attachment) => (
                    <DocRow
                      key={attachment.id}
                      record={record}
                      attachment={attachment}
                      labelOverride="Invoice"
                    />
                  ))}
                </div>
              )}

              {/* Warranty documents */}
              {warrantyFiles.length > 0 && (
                <div className="mb-4">
                  <h3 className={`mb-2 text-sm font-medium ${textMeta}`}>
                    Warranty file
                  </h3>
                  {warrantyFiles.map((attachment) => (
                    <DocRow
                      key={attachment.id}
                      record={record}
                      attachment={attachment}
                      labelOverride="Warranty"
                    />
                  ))}
                </div>
              )}

              {/* Other documents */}
              {otherDocs.length > 0 && (
                <div>
                  <h3 className={`mb-2 text-sm font-medium ${textMeta}`}>
                    Other documents
                  </h3>
                  {otherDocs.map((attachment) => (
                    <DocRow
                      key={attachment.id}
                      record={record}
                      attachment={attachment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right column: reminders + warranty */}
        <div className="flex flex-col gap-4">
          {/* Follow-up reminders */}
          <section className={glass + " rounded-2xl p-4 sm:p-5"}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">
                Follow-up reminders
              </h2>
              <Link
                href="/pro/contractor/reminders"
                className="text-xs font-medium text-purple-300 hover:text-purple-200"
              >
                View all
              </Link>
            </div>

            {reminders.length === 0 ? (
              <p className={textMeta + " mb-3 text-sm"}>
                Create reminders tied to this service — things like “Check in
                before winter” or “Annual maintenance follow-up”.
              </p>
            ) : (
              <ul className="mb-3 space-y-2 text-xs">
                {reminders.map((r) => (
                  <li
                    key={r.id}
                    className={
                      glassTight +
                      " rounded-xl px-3 py-2 flex flex-col gap-0.5 text-white/80"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="line-clamp-1 font-medium">
                        {r.title}
                      </span>
                      <span className="text-[11px] text-white/60">
                        {r.dueAt ? formatDate(r.dueAt) : "No due date"}
                      </span>
                    </div>
                    {r.note && (
                      <p className="line-clamp-2 text-[11px] text-white/60">
                        {r.note}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              className={ctaGhost + " w-full px-4 py-2 text-xs"}
              onClick={() => setReminderModalOpen(true)}
            >
              + Add follow-up reminder
            </button>
          </section>

          {/* Warranty summary + upload */}
          <section className={glass + " rounded-2xl p-4 sm:p-5"}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">Warranty</h2>
            </div>

            {record.warrantyIncluded ? (
              <div className="mb-3 space-y-1 text-xs text-white/80">
                <p className="font-medium text-white">
                  This service includes a warranty.
                </p>
                {record.warrantyLength && (
                  <p>
                    <span className="text-white/60">Term:</span>{" "}
                    {record.warrantyLength}
                  </p>
                )}
                {record.warrantyDetails && (
                  <p className="whitespace-pre-wrap text-white/70">
                    {record.warrantyDetails}
                  </p>
                )}
              </div>
            ) : (
              <p className={textMeta + " mb-3 text-sm"}>
                No warranty details were recorded for this service. You can
                still upload a warranty document if you have one.
              </p>
            )}

            {warranties.length > 0 && (
              <ul className="mb-3 space-y-2 text-xs">
                {warranties.map((w) => (
                  <li
                    key={w.id}
                    className={
                      glassTight +
                      " rounded-xl px-3 py-2 flex flex-col gap-0.5 text-white/80"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{w.title}</p>
                        {w.coverageTerm && (
                          <p className="text-[11px] text-white/60">
                            {w.coverageTerm}
                          </p>
                        )}
                      </div>
                      {w.attachment.url && (
                        <a
                          href={w.attachment.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-medium text-purple-300 hover:text-purple-200"
                        >
                          View
                        </a>
                      )}
                    </div>
                    {w.description && (
                      <p className="line-clamp-2 text-[11px] text-white/60">
                        {w.description}
                      </p>
                    )}
                    {w.acceptedAt && (
                      <p className="mt-0.5 text-[10px] text-emerald-300">
                        Accepted by homeowner on {formatDate(w.acceptedAt)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <label className="inline-flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-black/30 px-4 py-3 text-center text-xs text-white/70 hover:border-white/40 hover:bg-black/40">
              <span>
                {uploadingWarranty
                  ? "Uploading warranty..."
                  : "Upload warranty file (PDF / image)"}
              </span>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleWarrantyFileChange}
                disabled={uploadingWarranty}
              />
            </label>
          </section>
        </div>
      </div>

      {/* Reminder modal */}
      {reminderModalOpen && (
        <ContractorReminderModal
          {...({
            reminder: null,
            onCloseAction: () => setReminderModalOpen(false),
            onSaved: onReminderSaved,
          } as any)}
        />
      )}
    </>
  );
}

function DocRow({
  record,
  attachment,
  labelOverride,
}: {
  record: ServiceRecordDetail;
  attachment: AttachmentDTO;
  labelOverride?: string;
}) {
  const href = `/api/home/${record.homeId}/attachments/${attachment.id}`;
  const label = labelOverride || attachment.filename;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mb-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-colors hover:bg-white/10"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-white/10">
        {attachment.mimeType?.includes("pdf") ? (
          <span className="text-xl">📄</span>
        ) : (
          <span className="text-xl">📎</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{label}</p>
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
  );
}

function StatusPill({
  status,
  isVerified,
}: {
  status: string;
  isVerified: boolean;
}) {
  if (isVerified) {
    return (
      <span className="rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
        APPROVED
      </span>
    );
  }

  if (status === "DOCUMENTED_UNVERIFIED") {
    return (
      <span className="rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
        Pending homeowner review
      </span>
    );
  }

  if (status === "DISPUTED") {
    return (
      <span className="rounded-full border border-red-400/40 bg-red-500/15 px-3 py-1 text-xs font-medium text-red-200">
        Disputed
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-400/40 bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-200">
      {status}
    </span>
  );
}