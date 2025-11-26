"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { glass } from "@/lib/glass";

export function DisconnectContractor({
  connectionId,
  homeId,
  contractorName,
}: {
  connectionId: string;
  homeId: string;
  contractorName: string;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    setError(null);

    try {
      const res = await fetch(`/api/home/${homeId}/connections/${connectionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to disconnect");
      }

      router.push(`/home/${homeId}/contractors`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsDisconnecting(false);
    }
  };

  return (
    <>
      <section className={`${glass} border border-red-500/30`}>
        <h2 className="text-lg font-semibold text-red-400 mb-2">Danger Zone</h2>
        <p className="text-sm text-white/70 mb-4">
          Disconnect from this contractor. This will end your connection and your ability to
          request service, receive work submissions or send/receive messages from this contractor.
        </p>
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
        >
          Disconnect from {contractorName}
        </button>
      </section>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => !isDisconnecting && setShowConfirm(false)}
          />

          {/* Modal */}
          <div className="relative w-full max-w-md rounded-xl border border-white/20 bg-gray-900 p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-2">
              Disconnect from {contractorName}?
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Are you sure you want to disconnect from this contractor? This will:
            </p>
            <ul className="text-sm text-white/70 mb-6 space-y-1 ml-4">
              <li>• End your connection with this contractor</li>
              <li>• Prevent them from submitting new work</li>
              <li>• Cancel any pending job requests</li>
            </ul>
            <p className="text-sm text-white/70 mb-6">
              Your work history and records will be preserved.
            </p>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDisconnecting}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
              >
                {isDisconnecting ? "Disconnecting..." : "Yes, Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}