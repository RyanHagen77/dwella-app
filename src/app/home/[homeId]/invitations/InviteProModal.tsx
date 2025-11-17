// app/home/[homeId]/invitations/InviteProModal.tsx
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
  if (!trimmedEmail || !trimmedEmail.includes("@")) return;

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
      const msg = (payload && payload.error) || "Failed to send invitation";

      console.log("ERROR OCCURRED:", msg); // 🔍 DEBUG
      console.log("Toast function:", toast); // 🔍 DEBUG

      // Known validation / duplicate cases
      if (res.status === 400 || res.status === 409) {
        toast(msg);
        console.log("Toast called after 400/409"); // 🔍 DEBUG
        return;
      }

      // Unknown server error
      console.error("Invite API error:", payload);
      toast(msg);
      console.log("Toast called for unknown error"); // 🔍 DEBUG
      return;
    }

    // Success
    console.log("SUCCESS - calling toast"); // 🔍 DEBUG
    toast("Invitation sent successfully!");
    onCloseAction();
    setEmail("");
    setMessage("");
  } catch (error) {
    console.error("Error sending invitation:", error);
    console.log("CATCH block - calling toast"); // 🔍 DEBUG
    toast("Something went wrong sending the invitation. Please try again.");
  } finally {
    setLoading(false);
  }
}

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6">
        <h2 className="mb-2 text-xl font-bold text-white">Invite a Pro</h2>
        <p className={`mb-4 text-sm ${textMeta}`}>For {homeAddress}</p>

        <div className="space-y-4">
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
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur placeholder:text-white/40"
              rows={3}
              placeholder="Add a short note so they know why you're inviting them…"
            />
          </div>

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
              disabled={!email.includes("@") || loading}
              className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
            >
              {loading ? "Sending…" : "Send Invitation"}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}