"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import AddressVerification from "@/components/AddressVerification";

export function ClaimHomeModal({
  open,
  onCloseAction,
}: {
  open: boolean;
  onCloseAction: () => void;
}) {
  const { push } = useToast();

  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [verifiedAddress, setVerifiedAddress] = React.useState<{
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setVerifiedAddress(null);
      setSubmitting(false);
      setError(null);
    }
  }, [open]);

  function handleVerified(address: {
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  }) {
    setError(null);
    setVerifiedAddress(address);
  }

  async function claim() {
    if (!verifiedAddress || submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/home/claim", {
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

      const j = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };

      if (!res.ok) {
        setError(j.error || "Could not claim home.");
        return;
      }

      push("Home claimed!");
      onCloseAction(); // close modal first

      // Then navigate
      if (j.id) window.location.href = `/home/${j.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error claiming home");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setVerifiedAddress(null);
    setError(null);
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Claim Your Home">
      <div className="space-y-4">
        {!verifiedAddress ? (
          <>
            <p className="text-sm text-white/80">
              Enter your property address. We&apos;ll verify it with USPS to ensure accuracy.
            </p>

            <AddressVerification onVerified={handleVerified} />

            <div className="flex justify-end">
              <GhostButton type="button" onClick={onCloseAction}>
                Cancel
              </GhostButton>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
              <p className="mb-2 text-xs text-white/60">Verified Address</p>
              <p className="text-sm font-medium text-white">
                {verifiedAddress.street}
                {verifiedAddress.unit && ` ${verifiedAddress.unit}`}
              </p>
              <p className="text-sm text-white/85">
                {verifiedAddress.city}, {verifiedAddress.state} {verifiedAddress.zip}
              </p>

              <button
                type="button"
                onClick={handleReset}
                className="mt-2 text-xs text-white/70 hover:text-white"
                disabled={submitting}
              >
                Change address
              </button>
            </div>

            <p className="text-sm text-white/80">
              We&apos;ll attach this address to your account. You can manage access and records once
              it&apos;s claimed.
            </p>

            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-400/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-red-300">⚠️</span>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-red-200">
                      Unable to claim home
                    </div>
                    <p className="mt-1 text-sm text-red-100/90">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <GhostButton
                type="button"
                onClick={onCloseAction}
                disabled={submitting}
              >
                Cancel
              </GhostButton>
              <Button type="button" onClick={claim} disabled={submitting}>
                {submitting ? "Claiming…" : "Claim Home"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}