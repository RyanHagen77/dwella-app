// app/pro/contractor/invitations/ContractorInvitationsClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AddressVerification from "@/components/AddressVerification";
import { glass, heading, textMeta, ctaPrimary } from "@/lib/glass";
import { Modal } from "@/components/ui/Modal";
import { ContractorInvitationModal } from "./ContractorInvitationModal";
import { useToast } from "@/components/ui/Toast";

type Invitation = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: Date | string;
  expiresAt: Date | string;
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
    city: string;
    state: string;
    zip: string;
  } | null;
};

type Tab = "received" | "sent";

export default function ContractorInvitationsClient({
  receivedInvitations,
  sentInvitations,
}: {
  receivedInvitations: Invitation[];
  sentInvitations: Invitation[];
}) {
  const router = useRouter();
  const { push: toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("received");
  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(
    null
  );
  const [showInviteModal, setShowInviteModal] = useState(false);

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
        throw new Error(error?.error || "Failed to accept invitation");
      }

      toast("Invitation accepted! Connection established.");
      setShowAddressModal(false);
      setSelectedInvitation(null);
      router.refresh();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      toast(
        error instanceof Error ? error.message : "Failed to accept invitation"
      );
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
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Failed to decline invitation");
      }

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
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(err?.error || "Failed to cancel invitation");
      }

      toast("Invitation cancelled.");
      router.refresh();
    } catch (error) {
      console.error("Error cancelling invitation:", error);
      toast("Failed to cancel invitation. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  function handleInviteModalClose() {
    setShowInviteModal(false);
    router.refresh(); // Refresh to show newly sent invitation
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={glass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${heading}`}>Invitations</h1>
            <p className={`mt-1 ${textMeta}`}>
              Manage invitations you&apos;ve sent and received.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInviteModal(true)}
              className={ctaPrimary}
            >
              Invite Homeowner
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <section className={glass}>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("received")}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              activeTab === "received"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Received{" "}
            {receivedInvitations.filter((i) => i.status === "PENDING").length >
              0 &&
              `(${
                receivedInvitations.filter((i) => i.status === "PENDING")
                  .length
              })`}
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              activeTab === "sent"
                ? "border-white/40 bg-white/15 text-white"
                : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Sent{" "}
            {sentInvitations.filter((i) => i.status === "PENDING").length > 0 &&
              `(${sentInvitations.filter((i) => i.status === "PENDING").length})`}
          </button>
        </div>
      </section>

      {/* Content */}
      <section className={glass}>
        {activeTab === "received" ? (
          <ReceivedInvitationsTab
            invitations={receivedInvitations}
            processing={processing}
            onAccept={handleAcceptClick}
            onDecline={handleDecline}
          />
        ) : (
          <SentInvitationsTab
            invitations={sentInvitations}
            processing={processing}
            onCancel={handleCancel}
          />
        )}
      </section>

      {/* Address Verification Modal for ACCEPT */}
      {showAddressModal && (
        <Modal
          open={true}
          onCloseAction={() => {
            setShowAddressModal(false);
            setSelectedInvitation(null);
          }}
        >
          <div className="p-6">
            <h2 className="mb-2 text-xl font-bold text-white">
              Verify Property Address
            </h2>
            <p className={`mb-4 text-sm ${textMeta}`}>
              Please verify the property address to accept this invitation:
            </p>

            <AddressVerification onVerified={handleAddressVerified} />

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowAddressModal(false);
                  setSelectedInvitation(null);
                }}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Contractor Invite Homeowner Modal */}
      <ContractorInvitationModal
        open={showInviteModal}
        onCloseAction={handleInviteModalClose}
      />
    </div>
  );
}

/* ========== Received Invitations Tab ========== */

function ReceivedInvitationsTab({
  invitations,
  processing,
  onAccept,
  onDecline,
}: {
  invitations: Invitation[];
  processing: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PENDING"
  );
  const processedInvitations = invitations.filter(
    (inv) => inv.status !== "PENDING"
  );

  if (invitations.length === 0) {
    return (
      <div className="py-10 text-center text-white/80">
        <div className="mb-4 text-5xl">📨</div>
        <p className="text-lg">No invitations received yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pendingInvitations.length > 0 && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            Pending ({pendingInvitations.length})
          </h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {invitation.inviter?.image && (
                      <Image
                        src={invitation.inviter.image}
                        alt={invitation.inviter.name || "Homeowner"}
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
                      <p className="text-sm text-white/60">Homeowner</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-white/60">
                    <p>
                      Sent{" "}
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="mb-1 text-sm font-medium text-white/80">
                      Message:
                    </p>
                    <p className="text-white/70">{invitation.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onAccept(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white transition-all hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
                  >
                    {processing === invitation.id
                      ? "Processing..."
                      : "✓ Accept"}
                  </button>
                  <button
                    onClick={() => onDecline(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processedInvitations.length > 0 && (
        <div>
          <h2 className={`mb-4 text-lg font-semibold ${heading}`}>
            History ({processedInvitations.length})
          </h2>
          <div className="space-y-2">
            {processedInvitations.map((invitation) => (
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

/* ========== Sent Invitations Tab ========== */

function SentInvitationsTab({
  invitations,
  processing,
  onCancel,
}: {
  invitations: Invitation[];
  processing: string | null;
  onCancel: (id: string) => void;
}) {
  const pendingInvitations = invitations.filter(
    (inv) => inv.status === "PENDING"
  );
  const processedInvitations = invitations.filter(
    (inv) => inv.status !== "PENDING"
  );

  return (
    <>
      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-white">
            Pending ({pendingInvitations.length})
          </h2>
          <div className="space-y-4">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg font-semibold text-white">
                      {invitation.invitedEmail}
                    </p>
                    {invitation.invitedName && (
                      <p className="mt-1 text-sm text-white/60">
                        {invitation.invitedName}
                      </p>
                    )}
                    {invitation.home && (
                      <p className="mt-2 text-sm text-white/70">
                        📍 {invitation.home.address},{" "}
                        {invitation.home.city}, {invitation.home.state}{" "}
                        {invitation.home.zip}
                      </p>
                    )}
                  </div>
                  <div className="ml-4 shrink-0 text-right text-sm text-white/60">
                    <p>
                      Sent{" "}
                      {new Date(invitation.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      Expires{" "}
                      {new Date(invitation.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {invitation.message && (
                  <div className="mb-4 rounded-lg border border-white/20 bg-white/10 p-4">
                    <p className="mb-1 text-sm font-medium text-white/90">
                      Message:
                    </p>
                    <p className="text-white/80">{invitation.message}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => onCancel(invitation.id)}
                    disabled={processing === invitation.id}
                    className="rounded-lg border border-red-500/30 bg-red-500/20 px-4 py-2 font-medium text-red-300 transition-colors hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {processing === invitation.id
                      ? "Processing..."
                      : "Cancel Invitation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {processedInvitations.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-white">
            History ({processedInvitations.length})
          </h2>
          <div className="space-y-2">
            {processedInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-white/10"
              >
                <div className="flex-1">
                  <p className="font-medium text-white">
                    {invitation.invitedEmail}
                  </p>
                  {invitation.home && (
                    <p className="mt-1 text-sm text-white/60">
                      {invitation.home.address}, {invitation.home.city},{" "}
                      {invitation.home.state}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-white/50">
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <StatusBadge status={invitation.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {invitations.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center backdrop-blur-xl">
          <p className="text-lg text-white/70">No invitations sent yet.</p>
          <p className="mt-2 text-sm text-white/50">
            Invite homeowners from the invitations screen.
          </p>
        </div>
      )}
    </>
  );
}

/* ========== Status Badge ========== */

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