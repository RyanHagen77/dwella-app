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

  function handleClose() {
    console.log("🔴 Close button clicked");
    onCloseAction();
  }

  async function handleVerified(address: {
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
    if (!verifiedAddress) return;

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
      const j = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Show error in modal instead of just toast
        setError(j.error || "Could not claim home.");
        return;
      }

    // In ClaimHomeModal.tsx - update the success handler:

    push("Home claimed!");
    onCloseAction(); // Close modal first
    // Then let the parent component handle navigation, or:
    window.location.href = `/home/${j.id}`;
    } catch (err) {
      const error = err as Error;
      setError(error.message || "Error claiming home");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setVerifiedAddress(null);
  }

  return (
    <Modal open={open} onCloseAction={handleClose} title="Claim Your Home">
      <div className="space-y-4">
        {!verifiedAddress ? (
          <>
            <p className="text-sm text-white/80 mb-4">
              Enter your property address. We&apos;ll verify it with USPS to ensure accuracy.
            </p>
            <AddressVerification onVerified={handleVerified} />

            {/* Cancel button */}
            <div className="flex justify-end">
              <GhostButton onClick={handleClose}>Cancel</GhostButton>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-lg border border-white/20 bg-white/5 p-4">
              <p className="text-xs text-white/60 mb-2">Verified Address:</p>
              <p className="text-sm text-white font-medium">
                {verifiedAddress.street}
                {verifiedAddress.unit && ` ${verifiedAddress.unit}`}
              </p>
              <p className="text-sm text-white">
                {verifiedAddress.city}, {verifiedAddress.state} {verifiedAddress.zip}
              </p>
              <button
                onClick={handleReset}
                className="mt-2 text-xs text-white/70 hover:text-white"
              >
                Change address
              </button>
            </div>

            <p className="text-sm text-white/80">
              We&apos;ll attach this address to your account. You can manage access and
              records once it&apos;s claimed.
            </p>

            {/* Error message */}
            {error && (
              <div className="rounded-lg border border-red-400/30 bg-red-400/10 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-red-400">⚠️</span>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-red-300">
                      Unable to Claim Home
                    </h4>
                    <p className="mt-1 text-sm text-red-200">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <GhostButton onClick={handleClose}>Cancel</GhostButton>
              <Button onClick={claim} disabled={submitting}>
                {submitting ? "Claiming…" : "Claim Home"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}