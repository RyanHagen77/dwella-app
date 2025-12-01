// app/stats/[homeId]/invitations/InviteProModal.tsx
"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui";
import { textMeta } from "@/lib/glass";
import { useToast } from "@/components/ui/Toast";

type InviteProModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId: string;
  homeAddress: string;
};

export function InviteProModal({
  open,
  onCloseAction,
  homeId,
  homeAddress,
}: InviteProModalProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { push: toast } = useToast();

  if (!open) return null;

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

      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = payload?.error || "Failed to send invitation";
        toast(msg);
        return;
      }

      toast("Invitation sent successfully!");
      onCloseAction();
      setEmail("");
      setMessage("");
    } catch (error) {
      console.error("Error sending invitation:", error);
      toast("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-1 text-xl font-bold text-white">Invite a Pro</h2>
        <p className={`mb-4 text-xs text-white/70 ${textMeta}`}>
          For {homeAddress}
        </p>

        <div className="space-y-4">
          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Pro&apos;s Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pro@example.com"
              autoFocus
            />
            <p className={`mt-1 text-xs ${textMeta}`}>
              We’ll send them a secure link to connect to this home.
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-sm text-white outline-none backdrop-blur placeholder:text-white/40"
              rows={3}
              placeholder="Add a short note so they know why you're inviting them…"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCloseAction}
              disabled={loading}
              className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleInvite}
              disabled={loading || !email.trim()}
              className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}