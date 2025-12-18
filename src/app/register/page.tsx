// app/stats/[homeId]/invitations/InviteProModal.tsx
"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

type InviteProModalProps = {
  open: boolean;

  // ✅ preferred going forward (matches Next server-action naming rules)
  onCloseAction?: () => void;

  // ✅ back-compat for callers still passing onClose
  onClose?: () => void;

  homeId: string;
  homeAddress: string;
};

/** Clean controls: white border, thicker green on focus, NO amber ring */
const fieldShell =
  "rounded-2xl border-2 border-white/20 bg-black/35 backdrop-blur transition-colors " +
  "focus-within:border-[#33C17D]";

const fieldInner =
  "w-full bg-transparent px-4 py-2 text-sm text-white outline-none " +
  "placeholder:text-white/35 border-0 ring-0 focus:ring-0 focus:outline-none";

const textareaInner =
  "w-full bg-transparent px-4 py-3 text-sm text-white outline-none " +
  "placeholder:text-white/35 border-0 ring-0 focus:ring-0 focus:outline-none " +
  "resize-none min-h-[110px]";

export function InviteProModal({
  open,
  onCloseAction,
  onClose,
  homeId,
  homeAddress,
}: InviteProModalProps) {
  const { push: toast } = useToast();

  const [email, setEmail] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const close = React.useCallback(() => {
    if (loading) return;
    const fn = onCloseAction ?? onClose;
    if (typeof fn === "function") fn();
  }, [loading, onCloseAction, onClose]);

  // Reset when closing
  React.useEffect(() => {
    if (!open) {
      setEmail("");
      setMessage("");
      setLoading(false);
    }
  }, [open]);

  async function handleInvite() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      toast("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/invitations/home-to-pro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeId,
          email: trimmedEmail,
          message: message.trim() || undefined,
        }),
      });

      const payload = (await res.json().catch(() => null)) as { error?: string } | null;

      if (!res.ok) {
        toast(payload?.error || "Failed to send invitation");
        return;
      }

      toast("Invitation sent.");
      close();
    } catch (err) {
      console.error("Error sending invitation:", err);
      toast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Invite a Pro" onCloseAction={close}>
      <div className="space-y-4">
        <p className={`text-xs ${textMeta}`}>For {homeAddress}</p>

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
            Pro Email
          </span>
          <div className={fieldShell}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pro@example.com"
              className={fieldInner}
              autoFocus
            />
          </div>
          <p className={`mt-2 text-xs ${textMeta}`}>
            We’ll send them a secure link to connect to this home.
          </p>
        </label>

        <label className="block">
          <span className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-white/55">
            Message <span className="text-white/35">(optional)</span>
          </span>
          <div className={fieldShell}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a short note so they know why you're inviting them…"
              className={textareaInner}
              rows={4}
            />
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <GhostButton type="button" onClick={close} disabled={loading}>
            Cancel
          </GhostButton>
          <Button type="button" onClick={handleInvite} disabled={loading || !email.trim()}>
            {loading ? "Sending…" : "Send Invitation"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default InviteProModal;