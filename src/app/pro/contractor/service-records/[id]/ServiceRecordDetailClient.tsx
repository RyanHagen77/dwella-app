// app/pro/contractor/service-records/[id]/ServiceRecordDetailClient.tsx
"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { glass, glassTight, heading, textMeta, ctaGhost } from "@/lib/glass";
import ContractorReminderModal from "@/app/pro/contractor/reminders/ContractorReminderModal";

type AttachmentType = "photo" | "invoice" | "warranty" | "other";

type AttachmentDTO = {
  id: string;
  filename: string;
  url: string | null;
  mimeType: string | null;
  size: number; // bytes
  type?: AttachmentType;
};

type ReminderPreview = {
  id: string;
  title: string;
  dueAt: string | null;
  note?: string | null;
  status?: string | null;
  createdAt?: string | null;
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
  reminders?: ReminderPreview[];
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

type PresignResponse = {
  success: boolean;
  uploadUrls: {
    fileId: string;
    fileName: string;
    category: "photo" | "invoice" | "warranty";
    uploadUrl: string;
    key: string;
    publicUrl: string;
  }[];
};

export function ServiceRecordDetailClient({ record }: Props) {
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [reminders, setReminders] = useState<ReminderPreview[]>(
    record.reminders ?? []
  );
  const [uploadingWarranty, setUploadingWarranty] = useState(false);


  function onReminderSaved(saved: {
    id: string;
    title: string;
    dueAt?: string | null;
    note?: string | null;
    status?: string | null;
    createdAt?: string | null;
  }) {
    const preview: ReminderPreview = {
      id: saved.id,
      title: saved.title,
      dueAt: saved.dueAt ?? null,
      note: saved.note ?? null,
      status: saved.status ?? null,
      createdAt: saved.createdAt ?? null,
    };

    setReminders((prev) => {
      const idx = prev.findIndex((r) => r.id === preview.id);
      if (idx === -1) return [...prev, preview];
      const clone = [...prev];
      clone[idx] = preview;
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

      // 1) Presign
      const presignRes = await fetch(
        `/api/pro/contractor/service-records/${record.id}/upload`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            files: [
              {
                name: file.name,
                type: file.type,
                size: file.size,
                category: "warranty",
              },
            ],
          }),
        }
      );

      if (!presignRes.ok) {
        const j: unknown = await presignRes.json().catch(() => null);
        const msg =
          typeof j === "object" &&
          j &&
          "error" in j &&
          typeof (j as { error?: unknown }).error === "string"
            ? (j as { error: string }).error
            : "Failed to get upload URL";
        throw new Error(msg);
      }

      const presignJson = (await presignRes.json()) as PresignResponse;
      const uploadInfo = presignJson.uploadUrls?.[0];

      if (!uploadInfo?.uploadUrl || !uploadInfo.publicUrl) {
        throw new Error("Invalid presign response");
      }

      // 2) Upload PUT to storage
      const putRes = await fetch(uploadInfo.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!putRes.ok) {
        throw new Error("Failed to upload warranty file to storage");
      }

      // 3) PATCH record to link warranty file
      const patchRes = await fetch(
        `/api/pro/contractor/service-records/${record.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            warranty: uploadInfo.publicUrl,

            // ensure warranty is marked included once a file is uploaded
            warrantyIncluded: true,
            warrantyLength: record.warrantyLength ?? null,
            warrantyDetails: record.warrantyDetails ?? null,
          }),
        }
      );

      if (!patchRes.ok) {
        const j: unknown = await patchRes.json().catch(() => null);
        const msg =
          typeof j === "object" &&
          j &&
          "error" in j &&
          typeof (j as { error?: unknown }).error === "string"
            ? (j as { error: string }).error
            : "Failed to attach warranty to service record";
        throw new Error(msg);
      }

      alert("Warranty uploaded. Refresh to see it in attachments.");
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Something went wrong uploading the warranty."
      );
    } finally {
      setUploadingWarranty(false);
      e.target.value = "";
    }
  }

  // Attachment categorisation
  const photos = record.attachments.filter(
    (a) => a.type === "photo" || a.mimeType?.startsWith("image/")
  );
  const invoices = record.attachments.filter((a) => a.type === "invoice");
  const warrantyFiles = record.attachments.filter((a) => a.type === "warranty");
  const otherDocs = record.attachments.filter(
    (a) => (a.type === "other" || !a.type) && !a.mimeType?.startsWith("image/")
  );

  type ContractorReminderModalProps = ComponentProps<typeof ContractorReminderModal>;
  const reminderModalProps: ContractorReminderModalProps = {
    reminder: null,
    onClose: () => setReminderModalOpen(false),
    onSaved: onReminderSaved,
  };

  return (
    <>
      {/* Main grid */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,2.1fr)_minmax(0,1.1fr)]">
        {/* Left column */}
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
                {record.cost != null ? `$${record.cost.toFixed(2)}` : "Not provided"}
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
                  <h3 className={`mb-3 text-sm font-medium ${textMeta}`}>Photos</h3>
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
                          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Invoices */}
              {invoices.length > 0 && (
                <div className="mb-4">
                  <h3 className={`mb-2 text-sm font-medium ${textMeta}`}>Invoice</h3>
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

              {/* Warranty */}
              {warrantyFiles.length > 0 && (
                <div className="mb-4">
                  <h3 className={`mb-2 text-sm font-medium ${textMeta}`}>Warranty file</h3>
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

              {/* Other */}
              {otherDocs.length > 0 && (
                <div>
                  <h3 className={`mb-2 text-sm font-medium ${textMeta}`}>Other documents</h3>
                  {otherDocs.map((attachment) => (
                    <DocRow key={attachment.id} record={record} attachment={attachment} />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Follow-up reminders */}
          <section className={glass + " rounded-2xl p-4 sm:p-5"}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-white">Follow-up reminders</h2>
              <Link
                href="/pro/contractor/reminders"
                className="text-xs font-medium text-purple-300 hover:text-purple-200"
              >
                View all
              </Link>
            </div>

            {reminders.length === 0 ? (
              <p className={textMeta + " mb-3 text-sm"}>
                Create reminders tied to this service — things like “Check in before winter”
                or “Annual maintenance follow-up”.
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
                      <span className="line-clamp-1 font-medium">{r.title}</span>
                      <span className="text-[11px] text-white/60">
                        {r.dueAt ? formatDate(r.dueAt) : "No due date"}
                      </span>
                    </div>
                    {r.note ? (
                      <p className="line-clamp-2 text-[11px] text-white/60">
                        {r.note}
                      </p>
                    ) : null}
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
                    <span className="text-white/60">Term:</span> {record.warrantyLength}
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
                No warranty details were recorded for this service. You can still upload
                a warranty document if you have one.
              </p>
            )}

            <label className="inline-flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/25 bg-black/30 px-4 py-3 text-center text-xs text-white/70 hover:border-white/40 hover:bg-black/40">
              <span>
                {uploadingWarranty ? "Uploading warranty..." : "Upload warranty file (PDF / image)"}
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

      {reminderModalOpen && <ContractorReminderModal {...reminderModalProps} />}
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