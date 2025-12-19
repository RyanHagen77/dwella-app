// app/home/[homeId]/invitations/_components/InviteProModal.tsx
"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { textMeta } from "@/lib/glass";

type InviteProModalProps = {
  open: boolean;

  // preferred going forward
  onCloseAction?: () => void;

  // back-compat for older callers
  onClose?: () => void;

  homeId: string;
  homeAddress: string;
};

/** Clean glass controls: NO rings, focus via border only */
const fieldShell =
  "rounded-2xl border border-white/25 bg-black/35 backdrop-blur transition-colors overflow-hidden " +
  "focus-within:border-[#33C17D] focus-within:border-2";

/**
 * IMPORTANT:
 * - text-base on mobile prevents iOS Safari focus-zoom (modal looks “wide”)
 * - keep sm:text-sm for desktop density
 */
const fieldInner =
  "w-full bg-transparent text-white outline-none placeholder:text-white/40 " +
  "border-0 ring-0 focus:ring-0 focus:outline-none " +
  "text-base sm:text-sm";

const inputInner = `${fieldInner} px-4 py-2`;

/**
 * When the shell becomes border-2 on focus, keep the text visually aligned
 * by slightly reducing padding inside the textarea.
 */
const textareaInner =
  `${fieldInner} px-[15px] py-[11px] resize-none min-h-[110px]`;

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

  // Always callable (prevents "onCloseAction is undefined" crashes)
  const closeFn = React.useMemo(
    () => onCloseAction ?? onClose ?? (() => {}),
    [onCloseAction, onClose]
  );

  const close = React.useCallback(() => {
    if (loading) return;
    closeFn();
  }, [loading, closeFn]);

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

      const payload = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;

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
              className={inputInner}
              autoFocus
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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

          <Button
            type="button"
            onClick={handleInvite}
            disabled={loading || !email.trim()}
          >
            {loading ? "Sending…" : "Send Invitation"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}