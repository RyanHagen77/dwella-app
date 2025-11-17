"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";

type Connection = {
  id: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      verified: boolean;
    } | null;
  };
  createdAt: string;
};

type PendingWorkAttachment = {
  id: string;
  filename: string;
  mimeType: string | null;
  size: number;
  url: string | null;
};

type PendingWork = {
  id: string;
  title: string;
  description: string | null;
  workDate: string;
  cost: number | null;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
    } | null;
  };
  createdAt: string;
  attachments: PendingWorkAttachment[];
};

type Tab = "request-service" | "pending-work" | "find-pros";

export default function WorkClient({
  homeId,
  homeAddress,
  connections,
  pendingWork,
}: {
  homeId: string;
  homeAddress: string;
  connections: Connection[];
  pendingWork: PendingWork[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("request-service");

  return (
    <main className="relative min-h-screen text-white">
      {/* Background with gradient overlay */}
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

      <div className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/home/${homeId}`}
                className="mb-2 inline-flex items-center text-sm text-white/70 hover:text-white"
              >
                ← Back to Home
              </Link>
              <h1 className={`text-2xl font-semibold ${heading}`}>
                Work & Services
              </h1>
              <p className={`mt-1 ${textMeta}`}>{homeAddress}</p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className={glass}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("request-service")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "request-service"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Request Service ({connections.length} pros)
            </button>
            <button
              onClick={() => setActiveTab("pending-work")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "pending-work"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Pending Work
              {pendingWork.length > 0 && ` (${pendingWork.length})`}
            </button>
            <button
              onClick={() => setActiveTab("find-pros")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "find-pros"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Find Pros
            </button>
          </div>
        </section>

        {/* Content */}
        <section className={glass}>
          {activeTab === "request-service" && (
            <RequestServiceTab connections={connections} homeId={homeId} />
          )}
          {activeTab === "pending-work" && (
            <PendingWorkTab pendingWork={pendingWork} homeId={homeId} />
          )}
          {activeTab === "find-pros" && <FindProsTab homeId={homeId} />}
        </section>
      </div>
    </main>
  );
}

/* ---------- Request Service Tab ---------- */
function RequestServiceTab({
  connections,
  homeId,
}: {
  connections: Connection[];
  homeId: string;
}) {
  if (connections.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">🔧</div>
        <p className="text-lg">No connected contractors yet.</p>
        <p className={`mt-1 text-sm ${textMeta}`}>
          Invite pros to connect to this home so you can request service from them.
        </p>
        <Link
          href={`/home/${homeId}/invitations`}
          className={`${ctaPrimary} mt-4 inline-block`}
        >
          Invite a Pro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="mb-4 text-sm text-white/70">
        Request service from your connected contractors
      </p>
      {connections.map((connection) => (
        <div
          key={connection.id}
          className="rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {connection.contractor.image && (
                <Image
                  src={connection.contractor.image}
                  alt={
                    connection.contractor.name || connection.contractor.email
                  }
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              )}
              <div>
                <p className="text-lg font-semibold text-white">
                  {connection.contractor.name || connection.contractor.email}
                </p>
                {connection.contractor.proProfile && (
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/60">
                    <span>
                      {connection.contractor.proProfile.businessName ||
                        connection.contractor.proProfile.company}
                    </span>
                    {connection.contractor.proProfile.rating && (
                      <span>⭐ {connection.contractor.proProfile.rating}</span>
                    )}
                    {connection.contractor.proProfile.verified && (
                      <span className="text-emerald-300">✓ Verified</span>
                    )}
                  </div>
                )}
                {connection.contractor.proProfile?.phone && (
                  <p className="mt-1 text-sm text-white/60">
                    📞 {connection.contractor.proProfile.phone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button className={`${ctaPrimary} whitespace-nowrap text-sm`}>
                Request Service
              </button>
              <button className="whitespace-nowrap rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10">
                View History
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Pending Work Tab ---------- */
function PendingWorkTab({
  pendingWork,
  homeId,
}: {
  pendingWork: PendingWork[];
  homeId: string;
}) {
  const router = useRouter();

  async function handleApprove(workId: string) {
    try {
      const res = await fetch(`/api/home/${homeId}/work/${workId}/approve`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to approve work");

      alert("Work approved and added to your records!");
      router.refresh();
    } catch (error) {
      console.error("Error approving work:", error);
      alert("Failed to approve work");
    }
  }

  async function handleReject(workId: string) {
    if (!confirm("Are you sure you want to reject this work?")) return;

    try {
      const res = await fetch(`/api/home/${homeId}/work/${workId}/reject`, {
        method: "POST",
      });

      if (!res.ok) throw new Error("Failed to reject work");

      alert("Work rejected.");
      router.refresh();
    } catch (error) {
      console.error("Error rejecting work:", error);
      alert("Failed to reject work");
    }
  }

  if (pendingWork.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">✅</div>
        <p className="text-lg">No pending work to review.</p>
        <p className={`mt-1 text-sm ${textMeta}`}>
          When contractors complete work, it will appear here for your approval.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="mb-4 text-sm text-white/70">
        Review and approve work completed by your contractors
      </p>
      {pendingWork.map((work) => {
        const hasImages = work.attachments.some((a) =>
          a.mimeType?.startsWith("image/")
        );
        const hasDocs = work.attachments.some(
          (a) => a.mimeType && !a.mimeType.startsWith("image/")
        );

        return (
          <div
            key={work.id}
            className="rounded-xl border border-white/10 bg-white/5 p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {work.title}
                </h3>
                <p className="mt-1 text-sm text-white/70">
                  By: {work.contractor.name || work.contractor.email}
                  {work.contractor.proProfile?.businessName &&
                    ` (${work.contractor.proProfile.businessName})`}
                </p>
                {work.workDate && (
                  <p className="mt-1 text-sm text-white/60">
                    Work Date: {new Date(work.workDate).toLocaleDateString()}
                  </p>
                )}
                {work.cost !== null && (
                  <p className="mt-1 text-sm font-medium text-green-300">
                    Cost: ${Number(work.cost).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {work.description && (
              <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-sm text-white/80">{work.description}</p>
              </div>
            )}

            {/* Attachments preview */}
            {work.attachments.length > 0 && (
              <div className="mb-4 space-y-4">
                {hasImages && (
                  <div>
                    <h4 className={`mb-2 text-sm font-medium ${textMeta}`}>
                      Photos
                    </h4>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {work.attachments
                        .filter((a) => a.mimeType?.startsWith("image/"))
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${homeId}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5 transition hover:opacity-90"
                          >
                            <img
                              src={`/api/home/${homeId}/attachments/${attachment.id}`}
                              alt={attachment.filename}
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                              <span className="text-xs text-white opacity-0 group-hover:opacity-100">
                                View
                              </span>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

                {hasDocs && (
                  <div>
                    <h4 className={`mb-2 text-sm font-medium ${textMeta}`}>
                      Documents
                    </h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {work.attachments
                        .filter(
                          (a) => a.mimeType && !a.mimeType.startsWith("image/")
                        )
                        .map((attachment) => (
                          <a
                            key={attachment.id}
                            href={`/api/home/${homeId}/attachments/${attachment.id}`}
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
                                {(attachment.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </a>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(work.id)}
                className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-green-600 hover:to-emerald-600"
              >
                ✓ Approve & Add to Records
              </button>
              <button
                onClick={() => handleReject(work.id)}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Find Pros Tab ---------- */
function FindProsTab({ homeId }: { homeId: string }) {
  return (
    <div className="py-10 text-center">
      <div className="mb-4 text-5xl">🔍</div>
      <p className="mb-2 text-lg text-white/80">Find and invite contractors</p>
      <p className={`mb-6 text-sm ${textMeta}`}>
        Invite trusted pros to connect to this home
      </p>
      <Link
        href={`/home/${homeId}/invitations`}
        className={`${ctaPrimary} inline-block`}
      >
        Invite a Pro
      </Link>
    </div>
  );
}