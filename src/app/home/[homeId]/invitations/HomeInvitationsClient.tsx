// app/home/[homeId]/invitations/_components/HomeInvitationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddressVerification from "@/components/AddressVerification";
import { glass, glassTight, heading, textMeta, ctaPrimary } from "@/lib/glass";
import { InviteProModal } from "./InviteProModal";
import { useToast } from "@/components/ui/Toast";
import Breadcrumb from "@/components/ui/Breadcrumb";

/* ---------- Types ---------- */

type InvitationBase = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: string | Date;
  expiresAt: string | Date;
};

type ReceivedInvitation = InvitationBase & {
  inviter?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile?: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      verified: boolean;
    } | null;
  } | null;
  home?: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
};

type SentInvitation = InvitationBase & {
  home?: {
    id: string;
    address: string;
    city: string | null;
    state: string | null;
    zip: string | null;
  } | null;
};

type Tab = "received" | "sent";

/* ---------- Helpers ---------- */

function fmtDate(d: string | Date) {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "—";
  }
}

function inviterLabel(inv: ReceivedInvitation) {
  return (
    inv.inviter?.proProfile?.businessName ||
    inv.inviter?.proProfile?.company ||
    inv.inviter?.name ||
    inv.inviter?.email ||
    inv.invitedEmail
  );
}

/* ---------- Shared Status Badge ---------- */

function StatusBadge({ status }: { status: string }) {
  const styles =
    {
      PENDING: "bg-sky-500/15 text-sky-200 border-sky-500/30",
      ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/30",
      DECLINED: "bg-red-500/20 text-red-300 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      EXPIRED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    }[status] || "bg-white/10 text-white/60 border-white/20";

  return (
    <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold tracking-wide ${styles}`}>
      {status}
    </span>
  );
}

/* ---------- Received Tab ---------- */

function ReceivedTab({
  invitations,
  processing,
  onAccept,
  onDecline,
}: {
  invitations: ReceivedInvitation[];
  processing: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const pending = invitations.filter((inv) => inv.status === "PENDING");
  const history = invitations.filter((inv) => inv.status !== "PENDING");

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <div className="mb-3 text-5xl">📨</div>
        <p className="mb-1 text-white/90">No invitations received yet</p>
        <p className={`text-sm ${textMeta}`}>
          When a contractor invites you to connect, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${textMeta}`}>
            Pending ({pending.length})
          </h2>

          <div className="space-y-3">
            {pending.map((inv) => (
              <div
                key={inv.id}
                className={`${glassTight} flex flex-col gap-4 p-4 sm:p-5`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    {inv.inviter?.image ? (
                      <Image
                        src={inv.inviter.image}
                        alt={inv.inviter.name || inv.inviter.email}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                        <span className="text-lg font-medium">
                          {inviterLabel(inv)[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}

                    {/* Names + meta */}
                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">
                        {inviterLabel(inv)}
                      </p>

                      {inv.inviter?.proProfile && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                          {!!inv.inviter.proProfile.rating && (
                            <span>⭐ {inv.inviter.proProfile.rating}</span>
                          )}
                          {inv.inviter.proProfile.verified && (
                            <span className="text-emerald-300">✓ Verified</span>
                          )}
                          {inv.inviter.proProfile.phone && (
                            <span>{inv.inviter.proProfile.phone}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={inv.status} />
                    <p className={`text-[11px] ${textMeta}`}>
                      Sent {fmtDate(inv.createdAt)}
                    </p>
                    <p className={`text-[11px] ${textMeta}`}>
                      Expires {fmtDate(inv.expiresAt)}
                    </p>
                  </div>
                </div>

                {/* Message */}
                {inv.message && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-[11px] font-semibold text-white/80">
                      Message
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {inv.message}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => onAccept(inv.id)}
                    disabled={processing === inv.id}
                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                  >
                    {processing === inv.id ? "Processing..." : "✓ Accept"}
                  </button>

                  <button
                    onClick={() => onDecline(inv.id)}
                    disabled={processing === inv.id}
                    className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${textMeta}`}>
            History ({history.length})
          </h2>

          <div className="space-y-2">
            {history.map((inv) => (
              <div
                key={inv.id}
                className={`${glassTight} flex items-center justify-between gap-3 p-4`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {inv.inviter?.image ? (
                    <Image
                      src={inv.inviter.image}
                      alt={inv.inviter.name || inv.inviter.email}
                      width={36}
                      height={36}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium">
                        {inviterLabel(inv)[0]?.toUpperCase() || "?"}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {inviterLabel(inv)}
                    </p>
                    <p className={`text-xs ${textMeta}`}>
                      {fmtDate(inv.createdAt)}
                    </p>
                  </div>
                </div>

                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Sent Tab ---------- */

function SentTab({
  invitations,
  processing,
  onCancel,
}: {
  invitations: SentInvitation[];
  processing: string | null;
  onCancel: (id: string) => void;
}) {
  const pending = invitations.filter((inv) => inv.status === "PENDING");
  const history = invitations.filter((inv) => inv.status !== "PENDING");

  if (invitations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <p className="mb-1 text-white/90">No invitations sent yet</p>
        <p className={`text-sm ${textMeta}`}>
          Invite trusted pros to connect to this home from the home dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${textMeta}`}>
            Pending ({pending.length})
          </h2>

          <div className="space-y-3">
            {pending.map((inv) => (
              <div
                key={inv.id}
                className={`${glassTight} flex flex-col gap-3 p-4 sm:p-5`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">
                      {inv.invitedEmail}
                    </p>

                    {inv.home && (
                      <p className={`mt-1 text-xs ${textMeta} truncate`}>
                        📍 {inv.home.address}
                        {inv.home.city && `, ${inv.home.city}`}
                        {inv.home.state && `, ${inv.home.state}`}
                        {inv.home.zip && ` ${inv.home.zip}`}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={inv.status} />
                    <p className={`text-[11px] ${textMeta}`}>
                      Sent {fmtDate(inv.createdAt)}
                    </p>
                    <p className={`text-[11px] ${textMeta}`}>
                      Expires {fmtDate(inv.expiresAt)}
                    </p>
                  </div>
                </div>

                {inv.message && (
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-[11px] font-semibold text-white/80">
                      Message
                    </p>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {inv.message}
                    </p>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    onClick={() => onCancel(inv.id)}
                    disabled={processing === inv.id}
                    className="inline-flex w-full sm:w-auto items-center justify-center rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {processing === inv.id ? "Cancelling..." : "Cancel Invitation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${textMeta}`}>
            History ({history.length})
          </h2>

          <div className="space-y-2">
            {history.map((inv) => (
              <div
                key={inv.id}
                className={`${glassTight} flex items-center justify-between gap-3 p-4`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">
                    {inv.invitedEmail}
                  </p>

                  {inv.home && (
                    <p className={`mt-1 text-xs ${textMeta} truncate`}>
                      {inv.home.address}
                      {inv.home.city && `, ${inv.home.city}`}
                      {inv.home.state && `, ${inv.home.state}`}
                    </p>
                  )}

                  <p className={`mt-1 text-[11px] ${textMeta}`}>
                    {fmtDate(inv.createdAt)}
                  </p>
                </div>

                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Main Component ---------- */

export default function HomeInvitationsClient({
  homeId,
  homeAddress,
  receivedInvitations,
  sentInvitations,
}: {
  homeId: string;
  homeAddress: string;
  receivedInvitations?: ReceivedInvitation[];
  sentInvitations?: SentInvitation[];
}) {
  const router = useRouter();
  const { push: toast } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const received = receivedInvitations ?? [];
  const sent = sentInvitations ?? [];

  const pendingReceived = received.filter((inv) => inv.status === "PENDING");
  const pendingCount = pendingReceived.length;
  const pendingSentCount = sent.filter((i) => i.status === "PENDING").length;
  const totalInvitations = received.length + sent.length;

  function handleAcceptClick(invitationId: string) {
    setSelectedInvitation(invitationId);
    setShowAddressModal(true);
  }

  async function handleAddressVerified(verifiedAddress: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  }) {
    if (!selectedInvitation) return;
    setProcessing(selectedInvitation);

    try {
      const response = await fetch(
        `/api/invitations/${selectedInvitation}/accept`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            address: verifiedAddress.unit
              ? `${verifiedAddress.street} ${verifiedAddress.unit}`
              : verifiedAddress.street,
            city: verifiedAddress.city,
            state: verifiedAddress.state,
            zip: verifiedAddress.zip,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        toast(error?.error || "Failed to accept invitation");
        return;
      }

      toast("Invitation accepted! Connection established.");
      setShowAddressModal(false);
      setSelectedInvitation(null);
      router.refresh();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline(invitationId: string) {
    if (!confirm("Are you sure you want to decline this invitation?")) return;
    setProcessing(invitationId);

    try {
      const response = await fetch(
        `/api/invitations/${invitationId}/decline`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to decline invitation");

      toast("Invitation declined.");
      router.refresh();
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast("Failed to decline invitation. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleCancel(invitationId: string) {
    if (!confirm("Are you sure you want to cancel this invitation?")) return;
    setProcessing(invitationId);

    try {
      const response = await fetch(
        `/api/invitations/${invitationId}/cancel`,
        { method: "POST" }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Failed to cancel invitation");
      }

      toast("Invitation cancelled.");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast(error instanceof Error ? error.message : "Failed to cancel invitation");
    } finally {
      setProcessing(null);
    }
  }

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      {/* Match Messages page width/padding */}
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb href={`/home/${homeId}`} label={homeAddress} current="Invitations" />

        {/* Header (match Messages header) */}
        <section className={glass}>
          <div className="flex flex-col gap-4">
            {/* Back button */}
            <Link
              href={`/home/${homeId}`}
              className="flex items-center justify-center w-10 h-10 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl font-bold ${heading}`}>Contractor Invitations</h1>
              <p className={`mt-1 text-sm ${textMeta}`}>Manage pros invited to this home.</p>
              <p className={`mt-1 text-xs ${textMeta}`}>
                {totalInvitations} {totalInvitations === 1 ? "invitation" : "invitations"} • {pendingCount} pending
              </p>
            </div>

            {/* CTA */}
            <div>
              <button
                type="button"
                className={`${ctaPrimary} w-full sm:w-auto rounded-full px-5 py-2 text-sm font-semibold`}
                onClick={() => setInviteOpen(true)}
              >
                + Invite a Pro
              </button>
            </div>
          </div>
        </section>

        {/* Tabs (tight + consistent) */}
        <section className={glass}>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab("received")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "received"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Received {pendingCount > 0 && `(${pendingCount})`}
            </button>

            <button
              onClick={() => setActiveTab("sent")}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                activeTab === "sent"
                  ? "border-white/40 bg-white/15 text-white"
                  : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              Sent {pendingSentCount > 0 && `(${pendingSentCount})`}
            </button>
          </div>
        </section>

        {/* Content */}
        <section className={glass}>
          {activeTab === "received" ? (
            <ReceivedTab
              invitations={received}
              processing={processing}
              onAccept={handleAcceptClick}
              onDecline={handleDecline}
            />
          ) : (
            <SentTab
              invitations={sent}
              processing={processing}
              onCancel={handleCancel}
            />
          )}
        </section>

        {/* Address Verification Modal */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-6 backdrop-blur-xl shadow-2xl">
              <h3 className="mb-2 text-xl font-bold text-white">
                Verify Property Address
              </h3>
              <p className={`mb-4 text-sm ${textMeta}`}>
                Confirm the property address before connecting this pro to your home.
              </p>

              <AddressVerification onVerified={handleAddressVerified} />

              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setSelectedInvitation(null);
                }}
                className="mt-4 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Invite Pro Modal */}
        <InviteProModal
          open={inviteOpen}
          onCloseAction={() => setInviteOpen(false)}
          homeId={homeId}
          homeAddress={homeAddress}
        />
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