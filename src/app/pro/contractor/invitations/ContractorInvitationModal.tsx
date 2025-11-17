// app/pro/contractor/invitations/ContractorInvitationModal.tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui";
import AddressVerification from "@/components/AddressVerification";
import { useToast } from "@/components/ui/Toast"; // Update path if different

type ContractorInvitationModalProps = {
  open: boolean;
  onCloseAction: () => void;
};

type VerifiedAddress = {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
};

export function ContractorInvitationModal({
  open,
  onCloseAction,
}: ContractorInvitationModalProps) {
  const [step, setStep] = useState<"email" | "address" | "message">("email");
  const [email, setEmail] = useState("");
  const [verifiedAddress, setVerifiedAddress] =
    useState<VerifiedAddress | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { push: toast } = useToast();

  if (!open) return null;

// app/pro/contractor/invitations/ContractorInvitationModal.tsx

async function handleSubmit() {
  if (!verifiedAddress || !email) return;

  setLoading(true);

  try {
    const fullAddress = `${verifiedAddress.street}${
      verifiedAddress.unit ? ` ${verifiedAddress.unit}` : ""
    }, ${verifiedAddress.city}, ${verifiedAddress.state} ${
      verifiedAddress.zip
    }`;

    const response = await fetch("/api/invitations/pro-to-home", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),  // ✅ Changed from invitedEmail to email
        homeAddress: fullAddress,
        message: message || undefined,
      }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const msg =
        (payload && (payload.error as string)) ||
        "Failed to send invitation";

      // Known validation / duplicate cases: just show message, don't throw
      if (response.status === 400 || response.status === 409) {
        toast(msg);
        return;
      }

      // Unknown server error
      console.error("Invite API error:", payload);
      toast(msg);
      return;
    }

    // success
    toast("Invitation sent successfully!");
    onCloseAction();
    // reset internal state
    setStep("email");
    setEmail("");
    setVerifiedAddress(null);
    setMessage("");
  } catch (error) {
    console.error("Error sending invitation:", error);
    toast("Something went wrong sending the invitation. Please try again.");
  } finally {
    setLoading(false);
  }
}

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-4 text-xl font-bold text-white">
          Invite Homeowner
        </h2>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <StepDot active={step === "email"} completed={step !== "email"} label="1" />
          <div className="h-0.5 w-8 bg-white/20" />
          <StepDot
            active={step === "address"}
            completed={step === "message"}
            label="2"
          />
          <div className="h-0.5 w-8 bg-white/20" />
          <StepDot active={step === "message"} label="3" />
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Homeowner Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="homeowner@example.com"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCloseAction}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("address")}
                disabled={!email || !email.includes("@")}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                Next: Verify Address
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address Verification */}
        {step === "address" && (
          <div className="space-y-4">
            <AddressVerification
              onVerified={(address) => {
                setVerifiedAddress(address);
                setStep("message");
              }}
            />
            <button
              onClick={() => setStep("email")}
              className="text-sm text-white/70 hover:text-white"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Message */}
        {step === "message" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/20 bg-white/5 p-3">
              <p className="mb-1 text-xs text-white/60">Verified Address:</p>
              <p className="text-sm font-medium text-white">
                {verifiedAddress?.street}
                {verifiedAddress?.unit && ` ${verifiedAddress.unit}`}
              </p>
              <p className="text-sm text-white">
                {verifiedAddress?.city}, {verifiedAddress?.state}{" "}
                {verifiedAddress?.zip}
              </p>
              <button
                onClick={() => setStep("address")}
                className="mt-2 text-xs text-white/70 hover:text-white"
              >
                Change address
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Message (Optional)
              </label>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message to the homeowner..."
              className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur placeholder:text-white/40"
              rows={3}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStep("address")}
                disabled={loading}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !verifiedAddress}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StepDot({
  active,
  completed,
  label,
}: {
  active?: boolean;
  completed?: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
        completed
          ? "bg-green-400/20 text-green-300"
          : active
          ? "bg-orange-400/20 text-orange-300"
          : "bg-white/10 text-white/40"
      }`}
    >
      {completed ? "✓" : label}
    </div>
  );
}