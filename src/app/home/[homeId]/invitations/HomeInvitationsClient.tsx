// app/home/[homeId]/invitations/_components/HomeInvitationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddressVerification from "@/components/AddressVerification";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
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

/* ---------- Shared Status Badge ---------- */

function StatusBadge({ status }: { status: string }) {
  const styles =
    {
      ACCEPTED: "bg-green-500/20 text-green-300 border-green-500/30",
      DECLINED: "bg-red-500/20 text-red-300 border-red-500/30",
      CANCELLED: "bg-gray-500/20 text-gray-300 border-gray-500/30",
      EXPIRED: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    }[status] || "bg-white/10 text-white/60 border-white/20";

  return (
    <span className={`rounded-lg border px-3 py-1 text-sm font-medium ${styles}`}>
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
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">📨</div>
        <p className="text-lg">No invitations received yet.</p>
        <p className={`mt-1 text-sm ${textMeta}`}>
          When a contractor invites you to connect, you&apos;ll see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {invitation.inviter?.image && (
                      <Image
                        src={invitation.inviter.image}
                        alt={invitation.inviter.name || invitation.inviter.email}
                        width={50}
                        height={50}
                        className="rounded-full"
                      />
                    )}
                    <div>
                      <p className="text-lg font-semibold text-white">
                        {invitation.inviter?.name ||
                          invitation.inviter?.email ||
                          invitation.invitedEmail}
                      </p>
                      {invitation.inviter?.proProfile && (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/60">
                          <span>
                            {invitation.inviter.proProfile.businessName ||
                              invitation.inviter.proProfile.company}
                          </span>
                          {invitation.inviter.proProfile.rating != null && (
                            <span>⭐ {invitation.inviter.proProfile.rating}</span>
                          )}
                          {invitation.inviter.proProfile.verified && (
                            <span className="text-emerald-300">✓ Verified</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-white/60">
                    <p>Sent {new Date(invitation.createdAt).toLocaleDateString()}</p>
                    <p>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-xs font-medium text-white/80">Message:</p>
                    <p className="text-sm text-white/70">{invitation.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
                  >
                    {processing === invitation.id ? "Processing..." : "✓ Accept"}
                  </button>
                  <button
                    onClick={() => onDecline(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
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
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            History ({history.length})
          </h2>
          <div className="space-y-2">
            {history.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div>
                  <p className="font-medium text-white">
                    {invitation.inviter?.name ||
                      invitation.inviter?.email ||
                      invitation.invitedEmail}
                  </p>
                  <p className={`text-sm ${textMeta}`}>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={invitation.status} />
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
      <div className="rounded-xl border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        <p className="text-lg text-white/80">No invitations sent yet.</p>
        <p className={`mt-2 text-sm ${textMeta}`}>
          Invite trusted pros to connect to this home from the home dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="mb-4">
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">
                      {invitation.invitedEmail}
                    </p>
                    {invitation.home && (
                      <p className={`mt-1 text-sm ${textMeta}`}>
                        📍 {invitation.home.address}
                        {invitation.home.city && `, ${invitation.home.city}`}
                        {invitation.home.state && `, ${invitation.home.state}`}
                        {invitation.home.zip && ` ${invitation.home.zip}`}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 text-right text-xs text-white/60">
                    <p>Sent {new Date(invitation.createdAt).toLocaleDateString()}</p>
                    <p>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mt-3 rounded-lg border border-white/20 bg-white/10 p-3">
                    <p className="mb-1 text-xs font-medium text-white/90">Message:</p>
                    <p className="text-sm text-white/80">{invitation.message}</p>
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => onCancel(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {processing === invitation.id ? "Cancelling..." : "Cancel Invitation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            History ({history.length})
          </h2>
          <div className="space-y-2">
            {history.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">{invitation.invitedEmail}</p>
                  {invitation.home && (
                    <p className={`mt-1 text-sm ${textMeta}`}>
                      {invitation.home.address}
                      {invitation.home.city && `, ${invitation.home.city}`}
                      {invitation.home.state && `, ${invitation.home.state}`}
                    </p>
                  )}
                  <p className={`mt-1 text-xs ${textMeta}`}>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={invitation.status} />
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
      const response = await fetch(`/api/invitations/${selectedInvitation}/accept`, {
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
      });

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
      const response = await fetch(`/api/invitations/${invitationId}/decline`, {
        method: "POST",
      });
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
      const response = await fetch(`/api/invitations/${invitationId}/cancel`, {
        method: "POST",
      });

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

      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Breadcrumb */}
        <Breadcrumb
          href={`/home/${homeId}`}
          label={homeAddress}
          current="Invitations"
        />

        {/* Header */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Link
                href={`/home/${homeId}`}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back to home"
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

              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Contractor Invitations
                </h1>
                <p className={`text-sm ${textMeta} mt-1`}>
                  {totalInvitations}{" "}
                  {totalInvitations === 1 ? "invitation" : "invitations"} •{" "}
                  {pendingCount} pending
                </p>
              </div>
            </div>

            <div className="flex-shrink-0">
              <button
                type="button"
                className={ctaPrimary}
                onClick={() => setInviteOpen(true)}
              >
                + Invite a Pro
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className={glass}>
          <div className="flex gap-2">
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