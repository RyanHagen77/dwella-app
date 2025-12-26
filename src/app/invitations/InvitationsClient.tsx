// app/invitations/InvitationsClient.tsx
"use client";

import * as React from "react";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { glass, heading, textMeta } from "@/lib/glass";
import AddressVerification from "@/components/AddressVerification";

type Invitation = {
  id: string;
  invitedEmail: string;
  invitedName: string | null;
  role: string;
  message: string | null;
  status: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  inviter: {
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
};

const cardLink =
  "group relative block overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-5 backdrop-blur " +
  "transition hover:bg-black/30 hover:border-white/15";

function formatShortDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function statusPill(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "border-sky-400/25 bg-sky-400/10 text-sky-100";
  if (s === "ACCEPTED") return "border-emerald-400/25 bg-emerald-400/10 text-emerald-100";
  if (s === "DECLINED") return "border-red-400/25 bg-red-400/10 text-red-100";
  if (s === "CANCELLED") return "border-white/12 bg-white/5 text-white/70";
  return "border-white/12 bg-white/5 text-white/70";
}

function leftAccent(status: string) {
  const s = (status || "").toUpperCase();
  if (s === "PENDING") return "before:bg-sky-400/70";
  if (s === "ACCEPTED") return "before:bg-emerald-400/70";
  if (s === "DECLINED") return "before:bg-red-400/70";
  if (s === "CANCELLED") return "before:bg-white/18";
  return "before:bg-white/12";
}

export default function InvitationsClient({ invitations }: { invitations: Invitation[] }) {
  const router = useRouter();

  const [processing, setProcessing] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedInvitation, setSelectedInvitation] = useState<string | null>(null);

  const [confirmDeclineId, setConfirmDeclineId] = useState<string | null>(null);
  const confirmTimerRef = useRef<number | null>(null);

  const pendingInvitations = useMemo(
    () => invitations.filter((inv) => inv.status === "PENDING"),
    [invitations]
  );
  const processedInvitations = useMemo(
    () => invitations.filter((inv) => inv.status !== "PENDING"),
    [invitations]
  );

  function handleAcceptClick(invitationId: string) {
    setSelectedInvitation(invitationId);
    setShowAddressModal(true);
  }

  async function handleAddressVerified(verifiedAddress: { street: string; unit?: string; city: string; state: string; zip: string }) {
    if (!selectedInvitation) return;

    setProcessing(selectedInvitation);
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
        const error = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(error.error || "Failed to accept invitation");
      }

      setShowAddressModal(false);
      setSelectedInvitation(null);
      router.refresh();
    } catch (error) {
      console.error("Error accepting invitation:", error);
      alert(error instanceof Error ? error.message : "Failed to accept invitation");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline(invitationId: string) {
    // timed confirm, no native confirm()
    if (confirmDeclineId !== invitationId) {
      setConfirmDeclineId(invitationId);
      if (confirmTimerRef.current) window.clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = window.setTimeout(() => setConfirmDeclineId(null), 2500);
      return;
    }

    setProcessing(invitationId);
    try {
      const response = await fetch(`/api/pro/contractor/invitations/${invitationId}/decline`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to decline invitation");

      router.refresh();
    } catch (error) {
      console.error("Error declining invitation:", error);
      alert("Failed to decline invitation. Please try again.");
    } finally {
      setProcessing(null);
      setConfirmDeclineId(null);
    }
  }

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      {/* Overview row */}
      <section aria-labelledby="invites-overview" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="invites-overview" className={`text-lg font-semibold ${heading}`}>
            Overview
          </h2>

          <Link href="/dashboard" className="text-sm text-indigo-300 hover:text-indigo-200">
            Back to dashboard
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          <StatTile label="Pending" value={pendingInvitations.length} />
          <StatTile label="Past" value={processedInvitations.length} />
          <StatTile label="Total" value={invitations.length} />
          <StatTile label="Role" value="Contractor" />
        </div>
      </section>

      {/* Pending */}
      {pendingInvitations.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-white">Pending invitations</h3>

          <ul className="space-y-3">
            {pendingInvitations.map((inv) => (
              <li key={inv.id} className="list-none">
                <div
                  className={[
                    cardLink,
                    "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
                    leftAccent(inv.status),
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      {inv.inviter.image ? (
                        <Image src={inv.inviter.image} alt={inv.inviter.name || "Inviter"} width={48} height={48} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg">✉️</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-base font-semibold text-white">
                              {inv.inviter.name || inv.inviter.email}
                            </h4>

                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusPill(inv.status)}`}>
                              {inv.status}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-white/60">
                            Sent {formatShortDate(inv.createdAt)} • Expires {formatShortDate(inv.expiresAt)}
                          </p>

                          {inv.message ? (
                            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                              <p className={`text-[11px] font-semibold uppercase tracking-wide ${textMeta}`}>Message</p>
                              <p className="mt-1 text-sm text-white/85">{inv.message}</p>
                            </div>
                          ) : null}
                        </div>

                        <div className="hidden sm:flex items-center text-white/35" aria-hidden>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptClick(inv.id)}
                          disabled={processing === inv.id}
                          className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/15 disabled:opacity-60"
                        >
                          {processing === inv.id ? "Processing…" : "Accept"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDecline(inv.id)}
                          disabled={processing === inv.id}
                          className={[
                            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition disabled:opacity-60",
                            confirmDeclineId === inv.id
                              ? "border-red-400/45 bg-red-500/20 text-red-100 hover:bg-red-500/30"
                              : "border-red-400/25 bg-red-500/10 text-red-200 hover:bg-red-500/20",
                          ].join(" ")}
                        >
                          {processing === inv.id ? "Processing…" : confirmDeclineId === inv.id ? "Confirm?" : "Decline"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Past */}
      {processedInvitations.length > 0 ? (
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-white">Past invitations</h3>

          <ul className="space-y-3">
            {processedInvitations.map((inv) => (
              <li key={inv.id} className="list-none">
                <div
                  className={[
                    cardLink,
                    "before:absolute before:left-0 before:top-3 before:bottom-3 before:w-[3px] before:rounded-full",
                    leftAccent(inv.status),
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                      {inv.inviter.image ? (
                        <Image src={inv.inviter.image} alt={inv.inviter.name || "Inviter"} width={48} height={48} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-lg">📨</span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate text-base font-semibold text-white">
                              {inv.inviter.name || inv.inviter.email}
                            </h4>

                            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${statusPill(inv.status)}`}>
                              {inv.status}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-white/60">Sent {formatShortDate(inv.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Empty */}
      {invitations.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
          <div className="mb-3 text-4xl">✉️</div>
          <p className="mb-2 text-white/80">No invitations yet.</p>
          <p className={`text-sm ${textMeta}`}>When a homeowner invites you, it will show up here.</p>
        </section>
      ) : null}

      {/* Address Verification Modal */}
      {showAddressModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              setShowAddressModal(false);
              setSelectedInvitation(null);
            }}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-black/80 p-6 shadow-2xl backdrop-blur-xl">
            <h3 className="text-lg font-semibold text-white">Verify property address</h3>
            <p className="mt-2 text-sm text-white/70">
              Please verify the property address to accept this invitation.
            </p>

            <div className="mt-4">
              <AddressVerification onVerified={handleAddressVerified} />
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAddressModal(false);
                setSelectedInvitation(null);
              }}
              className="mt-4 w-full rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm text-white/85 transition hover:bg-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
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