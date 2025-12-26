"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import AddressVerification from "@/components/AddressVerification";
import { glass, glassTight, heading, indigoActionLink, textMeta } from "@/lib/glass";
import { InviteProModal } from "./_components/InviteProModal";
import { useToast } from "@/components/ui/Toast";

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
    proProfile?:
      | {
          businessName: string | null;
          company: string | null;
          phone: string | null;
          rating: number | null;
          verified: boolean;
        }
      | null;
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
    <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide ${styles}`}>
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
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <div className="mb-3 text-5xl">📨</div>
        <p className="mb-1 text-white/90">No invitations received yet</p>
        <p className={`text-sm ${textMeta}`}>When a contractor invites you to connect, you&apos;ll see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <div>
          <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Pending ({pending.length})</h2>

          <div className="space-y-3">
            {pending.map((inv) => (
              <div key={inv.id} className={`${glassTight} flex flex-col gap-4 p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {inv.inviter?.image ? (
                      <Image
                        src={inv.inviter.image}
                        alt={inv.inviter.name || inv.inviter.email}
                        width={48}
                        height={48}
                        className="h-12 w-12 rounded-full border border-white/10 object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20">
                        <span className="text-lg font-medium">{inviterLabel(inv)[0]?.toUpperCase() || "?"}</span>
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="truncate font-medium text-white">{inviterLabel(inv)}</p>

                      {inv.inviter?.proProfile ? (
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/60">
                          {inv.inviter.proProfile.rating ? <span>⭐ {inv.inviter.proProfile.rating}</span> : null}
                          {inv.inviter.proProfile.verified ? <span className="text-emerald-300">✓ Verified</span> : null}
                          {inv.inviter.proProfile.phone ? <span>{inv.inviter.proProfile.phone}</span> : null}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={inv.status} />
                    <div className={`text-[11px] ${textMeta}`}>Sent {fmtDate(inv.createdAt)}</div>
                    <div className={`text-[11px] ${textMeta}`}>Expires {fmtDate(inv.expiresAt)}</div>
                  </div>
                </div>

                {inv.message ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/55">Message</div>
                    <p className="text-sm leading-relaxed text-white/80">{inv.message}</p>
                  </div>
                ) : null}

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => onAccept(inv.id)}
                    disabled={processing === inv.id}
                    className="inline-flex items-center justify-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-400/15 hover:border-emerald-300/35 disabled:opacity-50"
                  >
                    {processing === inv.id ? "Processing..." : "✓ Accept"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDecline(inv.id)}
                    disabled={processing === inv.id}
                    className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10 disabled:opacity-50"
                  >
                    ✗ Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div>
          <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>History ({history.length})</h2>

          <div className="space-y-2">
            {history.map((inv) => (
              <div key={inv.id} className={`${glassTight} flex items-center justify-between gap-3 p-4`}>
                <div className="flex min-w-0 items-center gap-3">
                  {inv.inviter?.image ? (
                    <Image
                      src={inv.inviter.image}
                      alt={inv.inviter.name || inv.inviter.email}
                      width={36}
                      height={36}
                      className="h-9 w-9 rounded-full border border-white/10 object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/20">
                      <span className="text-sm font-medium">{inviterLabel(inv)[0]?.toUpperCase() || "?"}</span>
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">{inviterLabel(inv)}</p>
                    <p className={`text-xs ${textMeta}`}>{fmtDate(inv.createdAt)}</p>
                  </div>
                </div>

                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
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
      <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
        <p className="mb-1 text-white/90">No invitations sent yet</p>
        <p className={`text-sm ${textMeta}`}>Invite trusted pros to connect to this home from the home dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {pending.length > 0 ? (
        <div>
          <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>Pending ({pending.length})</h2>

          <div className="space-y-3">
            {pending.map((inv) => (
              <div key={inv.id} className={`${glassTight} flex flex-col gap-3 p-4 sm:p-5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-white">{inv.invitedEmail}</p>

                    {inv.home ? (
                      <p className={`mt-1 truncate text-xs ${textMeta}`}>
                        📍 {inv.home.address}
                        {inv.home.city ? `, ${inv.home.city}` : ""}
                        {inv.home.state ? `, ${inv.home.state}` : ""}
                        {inv.home.zip ? ` ${inv.home.zip}` : ""}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={inv.status} />
                    <p className={`text-[11px] ${textMeta}`}>Sent {fmtDate(inv.createdAt)}</p>
                    <p className={`text-[11px] ${textMeta}`}>Expires {fmtDate(inv.expiresAt)}</p>
                  </div>
                </div>

                {inv.message ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/55">Message</div>
                    <p className="text-sm leading-relaxed text-white/80">{inv.message}</p>
                  </div>
                ) : null}

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => onCancel(inv.id)}
                    disabled={processing === inv.id}
                    className="inline-flex w-full items-center justify-center rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35 disabled:opacity-50 sm:w-auto"
                  >
                    {processing === inv.id ? "Cancelling..." : "Cancel invitation"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {history.length > 0 ? (
        <div>
          <h2 className={`mb-3 text-xs font-semibold uppercase tracking-wide ${textMeta}`}>History ({history.length})</h2>

          <div className="space-y-2">
            {history.map((inv) => (
              <div key={inv.id} className={`${glassTight} flex items-center justify-between gap-3 p-4`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white">{inv.invitedEmail}</p>

                  {inv.home ? (
                    <p className={`mt-1 truncate text-xs ${textMeta}`}>
                      {inv.home.address}
                      {inv.home.city ? `, ${inv.home.city}` : ""}
                      {inv.home.state ? `, ${inv.home.state}` : ""}
                    </p>
                  ) : null}

                  <p className={`mt-1 text-[11px] ${textMeta}`}>{fmtDate(inv.createdAt)}</p>
                </div>

                <StatusBadge status={inv.status} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
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

  // ✅ parity with Warranties: collapsed by default on mobile
  const [isExpanded, setIsExpanded] = useState(false);

  const received = receivedInvitations ?? [];
  const sent = sentInvitations ?? [];

  const pendingReceived = received.filter((inv) => inv.status === "PENDING").length;
  const pendingSent = sent.filter((inv) => inv.status === "PENDING").length;

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
          address: verifiedAddress.unit ? `${verifiedAddress.street} ${verifiedAddress.unit}` : verifiedAddress.street,
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
      const response = await fetch(`/api/invitations/${invitationId}/decline`, { method: "POST" });
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
      const response = await fetch(`/api/invitations/${invitationId}/cancel`, { method: "POST" });

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
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* ✅ Overview (match Warranties/Reminders) */}
      <section aria-labelledby="invites-overview" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-2 text-left lg:cursor-default"
          >
            <h2 id="invites-overview" className={`text-lg font-semibold ${heading}`}>
              Overview
            </h2>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 transition-transform lg:hidden ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* ✅ standard indigo action link */}
          <button type="button" onClick={() => setInviteOpen(true)} className={indigoActionLink}>
            + Invite a Pro
          </button>
        </div>

        <div className={`${isExpanded ? "grid" : "hidden"} grid-cols-2 gap-3 lg:grid lg:grid-cols-4 lg:gap-4`}>
          <StatTile label="Pending received" value={pendingReceived} />
          <StatTile label="Pending sent" value={pendingSent} />
          <StatTile label="Total received" value={received.length} />
          <StatTile label="Total sent" value={sent.length} />
        </div>
      </section>

      {/* Tabs (secondary control) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* ✅ remove border to match “standard” (you called this out) */}
        <div className="inline-flex overflow-hidden rounded-full bg-white/5 p-0.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => setActiveTab("received")}
            className={[
              "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
              activeTab === "received"
                ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
                : "text-white/80 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            Received{pendingReceived > 0 ? ` (${pendingReceived})` : ""}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("sent")}
            className={[
              "px-4 py-1.5 text-sm rounded-full transition flex items-center justify-center font-medium",
              activeTab === "sent"
                ? "bg-white/10 text-white shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.35)]"
                : "text-white/80 hover:text-white hover:bg-white/5",
            ].join(" ")}
          >
            Sent{pendingSent > 0 ? ` (${pendingSent})` : ""}
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {activeTab === "received" ? (
          <ReceivedTab
            invitations={received}
            processing={processing}
            onAccept={handleAcceptClick}
            onDecline={handleDecline}
          />
        ) : (
          <SentTab invitations={sent} processing={processing} onCancel={handleCancel} />
        )}
      </div>

      {/* Address verification modal (kept) */}
      {showAddressModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-gradient-to-br from-gray-900 to-gray-800 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="mb-2 text-xl font-bold text-white">Verify Property Address</h3>
            <p className={`mb-4 text-sm ${textMeta}`}>Confirm the property address before connecting this pro to your home.</p>

            <AddressVerification onVerified={handleAddressVerified} />

            <button
              type="button"
              onClick={() => {
                setShowAddressModal(false);
                setSelectedInvitation(null);
              }}
              className="mt-4 w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <InviteProModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className={`${glass} p-4`} title={label}>
      <p className={`text-xs ${textMeta} whitespace-nowrap`}>{label}</p>
      <p className="mt-2 text-lg lg:text-xl font-bold text-white">{value}</p>
    </div>
  );
}