"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import AddressVerification from "@/components/AddressVerification";
import { useToast } from "@/components/ui/Toast";
import { ctaGhost, ctaPrimary, textMeta } from "@/lib/glass";

type ContractorInvitationModalProps = {
  open: boolean;
  // Keep *Action so Next doesn't complain about non-serializable props at the boundary
  onCloseAction: () => void;
};

type VerifiedAddress = {
  street: string;
  unit?: string;
  city: string;
  state: string;
  zip: string;
};

// ✅ Use the exact control styles you specified
const fieldShell =
  "rounded-2xl border border-white/10 bg-black/35 backdrop-blur transition " +
  "focus-within:border-white/18 focus-within:bg-black/45 overflow-hidden";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none placeholder:text-white/35 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none";

export function ContractorInvitationModal({
  open,
  onCloseAction: onClose,
}: ContractorInvitationModalProps) {
  const [step, setStep] = useState<"email" | "address" | "message">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verifiedAddress, setVerifiedAddress] = useState<VerifiedAddress | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { push: toast } = useToast();

  // Remove after confirming once.
  const DEBUG_MARKER = "INVITE_MODAL_V2";

  function reset() {
    setStep("email");
    setEmail("");
    setPhone("");
    setVerifiedAddress(null);
    setMessage("");
  }

  function closeAndReset() {
    reset();
    onClose();
  }

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }

  async function handleSubmit() {
    if (!verifiedAddress || !email) return;

    setLoading(true);
    try {
      const fullAddress = `${verifiedAddress.street}${
        verifiedAddress.unit ? ` ${verifiedAddress.unit}` : ""
      }, ${verifiedAddress.city}, ${verifiedAddress.state} ${verifiedAddress.zip}`;

      const response = await fetch("/api/invitations/pro-to-home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone ? phone.replace(/\D/g, "") : undefined,
          homeAddress: fullAddress,
          message: message.trim() ? message.trim() : undefined,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const msg = (payload && (payload.error as string)) || "Failed to send invitation";
        toast(msg);
        return;
      }

      toast("Invitation sent.");
      closeAndReset();
    } catch (e) {
      console.error(e);
      toast("Something went wrong sending the invitation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={closeAndReset} title="Invite Homeowner">
      <div className="space-y-6">
        <div className="text-[10px] text-white/25">{DEBUG_MARKER}</div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2">
          <StepDot active={step === "email"} completed={step !== "email"} label="1" />
          <div className="h-px w-10 bg-white/15" />
          <StepDot active={step === "address"} completed={step === "message"} label="2" />
          <div className="h-px w-10 bg-white/15" />
          <StepDot active={step === "message"} label="3" />
        </div>

        {/* Step 1 */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                Homeowner Email
              </label>
              <div className={fieldShell}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="homeowner@example.com"
                  className={fieldInner}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                Phone <span className="text-white/35">(optional)</span>
              </label>
              <div className={fieldShell}>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  placeholder="(555) 123-4567"
                  className={fieldInner}
                  maxLength={14}
                />
              </div>
              <p className={`mt-2 text-xs ${textMeta}`}>Used only to send the invitation link.</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={closeAndReset} className={ctaGhost} disabled={loading}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep("address")}
                disabled={loading || !email.trim() || !email.includes("@")}
                className={ctaPrimary}
              >
                Verify Address →
              </button>
            </div>
          </div>
        )}

        {/* Step 2 */}
        {step === "address" && (
          <div className="space-y-4">
            <AddressVerification
              onVerified={(address) => {
                setVerifiedAddress(address);
                setStep("message");
              }}
            />

            <button type="button" onClick={() => setStep("email")} className={ctaGhost} disabled={loading}>
              ← Back
            </button>
          </div>
        )}

        {/* Step 3 */}
        {step === "message" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <p className="text-xs text-white/55">Verified address</p>
              <p className="mt-1 text-sm text-white">
                {verifiedAddress?.street}
                {verifiedAddress?.unit ? ` ${verifiedAddress.unit}` : ""}
              </p>
              <p className="text-sm text-white/70">
                {verifiedAddress?.city}, {verifiedAddress?.state} {verifiedAddress?.zip}
              </p>

              <button
                type="button"
                onClick={() => setStep("address")}
                className="mt-3 text-xs text-white/70 hover:text-white"
                disabled={loading}
              >
                Change address
              </button>
            </div>

            <div>
              <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
                Message <span className="text-white/35">(optional)</span>
              </label>
              <div className={fieldShell}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a note…"
                  className={[fieldInner, "min-h-[90px] resize-none py-3"].join(" ")}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep("address")}
                className={ctaGhost}
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className={ctaPrimary}
                disabled={loading || !verifiedAddress}
              >
                {loading ? "Sending…" : "Send Invitation"}
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
      className={[
        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
        completed
          ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/25"
          : active
          ? "bg-orange-500/15 text-orange-200 border border-orange-500/25"
          : "bg-white/5 text-white/40 border border-white/10",
      ].join(" ")}
    >
      {completed ? "✓" : label}
    </div>
  );
}