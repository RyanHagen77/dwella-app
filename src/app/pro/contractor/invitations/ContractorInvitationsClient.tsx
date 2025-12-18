// app/pro/contractor/invitations/ContractorInvitationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AddressVerification from "@/components/AddressVerification";
import { Modal } from "@/components/ui/Modal";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { glass, glassTight, heading, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { useToast } from "@/components/ui/Toast";

type HomeLite =
  | {
      id: string;
      address: string;
      city: string;
      state: string;
      zip: string;
    }
  | null;

type InviterLite = {
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

type ReceivedInvitation = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  inviter: InviterLite;
  home: HomeLite;
};

type SentInvitation = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: Date | string;
  expiresAt: Date | string;
  home: HomeLite;
};

export default function ContractorInvitationsClient({
  receivedInvitations = [],
  sentInvitations = [],
}: {
  receivedInvitations: ReceivedInvitation[];
  sentInvitations: SentInvitation[];
}) {
  const router = useRouter();
  const { push: toast } = useToast();

  const [processing, setProcessing] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingReceived = receivedInvitations.filter((inv) => inv.status === "PENDING");
  const processedReceived = receivedInvitations.filter((inv) => inv.status !== "PENDING");

  const pendingSent = sentInvitations.filter((inv) => inv.status === "PENDING");
  const processedSent = sentInvitations.filter((inv) => inv.status !== "PENDING");

  function handleAcceptClick(invitationId: string) {
    setSelectedInvitation(invitationId);
    setShowAddressModal(true);
    setError(null);
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
    setError(null);

    try {
      const response = await fetch(`/api/pro/contractor/invitations/${selectedInvitation}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: verifiedAddress.unit ? `${verifiedAddress.street} ${verifiedAddress.unit}` : verifiedAddress.street,
          city: verifiedAddress.city,
          state: verifiedAddress.state,
          zip: verifiedAddress.zip,
        }),
      });

      if (!response.ok) {
        const e = await response.json().catch(() => null);
        throw new Error(e?.error || "Failed to accept invitation");
      }

      setShowAddressModal(false);
      setSelectedInvitation(null);
      router.refresh();
    } catch (e) {
      console.error("Error accepting invitation:", e);
      setError(e instanceof Error ? e.message : "Failed to accept invitation");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline(invitationId: string) {
    setProcessing(invitationId);
    setError(null);

    try {
      const response = await fetch(`/api/pro/contractor/invitations/${invitationId}/decline`, {
        method: "POST",
      });

      if (!response.ok) {
        const e = await response.json().catch(() => null);
        throw new Error(e?.error || "Failed to decline invitation");
      }

      router.refresh();
    } catch (e) {
      console.error("Error declining invitation:", e);
      setError(e instanceof Error ? e.message : "Failed to decline invitation. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleResend(invitation: SentInvitation) {
    setResendingId(invitation.id);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitation.id}/resend`, { method: "POST" });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = (payload && (payload.error as string)) || "Failed to resend invitation";
        toast(msg);
        setError(msg);
        return;
      }

      toast("Invitation email resent.");
    } catch (e) {
      console.error("Error resending invitation:", e);
      const msg = e instanceof Error ? e.message : "Something went wrong resending the invitation.";
      toast(msg);
      setError(msg);
    } finally {
      setResendingId(null);
    }
  }

  const hasAnyInvitations = receivedInvitations.length > 0 || sentInvitations.length > 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Breadcrumb (match your standard pages) */}
      <div className="px-4">
        <Breadcrumb href="/pro/contractor/dashboard" label="Dashboard" current="Invitations" />
      </div>

      {/* Header (single row) */}
      <section className={glass}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/pro/contractor/dashboard"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
              aria-label="Back to dashboard"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </Link>

            <div className="min-w-0">
              <h1 className={`truncate text-2xl font-bold ${heading}`}>Invitations</h1>
              <p className={`truncate text-sm ${textMeta}`}>
                {pendingReceived.length} pending received
                {pendingSent.length > 0 ? ` • ${pendingSent.length} pending sent` : ""}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Error banner */}
      {error && (
        <section className={`${glass} border-l-4 border-red-400`}>
          <p className="text-sm text-red-200">{error}</p>
        </section>
      )}

      {/* ===================== RECEIVED ===================== */}
      {pendingReceived.length > 0 && (
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Pending (Received)</h2>
          <div className="space-y-3">
            {pendingReceived.map((invitation) => (
              <div key={invitation.id} className={`${glassTight} border border-blue-500/40 bg-blue-500/10`}>
                {/* Inviter Info */}
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {invitation.inviter.image ? (
                      <Image
                        src={invitation.inviter.image}
                        alt={invitation.inviter.name || "Homeowner"}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-lg font-semibold">
                        {(invitation.inviter.name || invitation.inviter.email || "H")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {invitation.inviter.name || invitation.inviter.email}
                      </p>

                      {invitation.home?.address && (
                        <p className={`mt-1 truncate text-xs ${textMeta}`}>
                          {invitation.home.address}, {invitation.home.city}, {invitation.home.state} {invitation.home.zip}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right text-xs text-white/60 flex-shrink-0">
                    <p>Sent {new Date(invitation.createdAt).toLocaleDateString()}</p>
                    <p>Expires {new Date(invitation.expiresAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Message */}
                {invitation.message && (
                  <div className="mb-4 rounded-lg bg-black/40 p-3">
                    <p className="mb-1 text-xs font-medium text-white/80">Message</p>
                    <p className="text-sm text-white/80">{invitation.message}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAcceptClick(invitation.id)}
                    disabled={processing === invitation.id}
                    className={ctaPrimary}
                  >
                    {processing === invitation.id ? "Processing..." : "✓ Accept"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecline(invitation.id)}
                    disabled={processing === invitation.id}
                    className={ctaGhost}
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {processedReceived.length > 0 && (
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Past (Received)</h2>
          <div className="space-y-2">
            {processedReceived.map((invitation) => (
              <div key={invitation.id} className={`${glassTight} flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">
                    {invitation.inviter.name || invitation.inviter.email}
                  </p>
                  <p className={`text-xs ${textMeta}`}>Sent {new Date(invitation.createdAt).toLocaleDateString()}</p>
                </div>

                <span
                  className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                    invitation.status === "ACCEPTED"
                      ? "bg-green-500/20 text-green-200 border border-green-500/40"
                      : invitation.status === "CANCELLED"
                      ? "bg-white/10 text-white/70 border border-white/20"
                      : "bg-red-500/20 text-red-200 border border-red-500/40"
                  }`}
                >
                  {invitation.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================== SENT ===================== */}
      {(pendingSent.length > 0 || processedSent.length > 0) && (
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>Sent</h2>

          {pendingSent.length > 0 && (
            <div className="mb-4 space-y-2">
              {pendingSent.map((inv) => (
                <div key={inv.id} className={`${glassTight} flex items-center justify-between gap-3`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{inv.invitedName || inv.invitedEmail}</p>
                    {inv.home?.address && (
                      <p className={`truncate text-xs ${textMeta}`}>
                        {inv.home.address}, {inv.home.city}, {inv.home.state} {inv.home.zip}
                      </p>
                    )}
                    <p className={`text-xs ${textMeta}`}>Sent {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex flex-shrink-0 items-center gap-2">
                    <span className="rounded-full px-3 py-1 text-xs font-semibold bg-yellow-500/20 text-yellow-200 border border-yellow-500/40">
                      PENDING
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResend(inv)}
                      disabled={resendingId === inv.id}
                      className="rounded-full border border-white/25 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10 disabled:opacity-50"
                    >
                      {resendingId === inv.id ? "Resending..." : "Resend"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {processedSent.length > 0 && (
            <div className="space-y-2">
              {processedSent.map((inv) => (
                <div key={inv.id} className={`${glassTight} flex items-center justify-between gap-3`}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{inv.invitedName || inv.invitedEmail}</p>
                    {inv.home?.address && (
                      <p className={`truncate text-xs ${textMeta}`}>
                        {inv.home.address}, {inv.home.city}, {inv.home.state} {inv.home.zip}
                      </p>
                    )}
                    <p className={`text-xs ${textMeta}`}>Sent {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>

                  <span
                    className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                      inv.status === "ACCEPTED"
                        ? "bg-green-500/20 text-green-200 border border-green-500/40"
                        : inv.status === "CANCELLED"
                        ? "bg-white/10 text-white/70 border border-white/20"
                        : "bg-red-500/20 text-red-200 border border-red-500/40"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Empty state */}
      {!hasAnyInvitations && (
        <section className={glass}>
          <div className="rounded-xl border border-dashed border-white/25 bg-white/5 p-8 text-center">
            <p className="mb-1 text-white/80">No invitations yet</p>
            <p className={`text-sm ${textMeta}`}>Invites will appear here when homeowners send them.</p>
          </div>
        </section>
      )}

      {/* Address Verification Modal */}
      <Modal
        open={showAddressModal}
        onClose={() => {
          setShowAddressModal(false);
          setSelectedInvitation(null);
        }}
        title="Verify Property Address"
      >
        <div className="mt-2 space-y-4 text-white">
          <AddressVerification onVerified={handleAddressVerified} />

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setShowAddressModal(false);
                setSelectedInvitation(null);
              }}
              className={ctaGhost}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}