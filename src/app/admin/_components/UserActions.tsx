/**
 * ADMIN USER ACTIONS
 *
 * Action buttons for user management.
 *
 * Location: app/admin/users/[id]/_components/UserActions.tsx
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ctaPrimary, ctaDanger } from "@/lib/glass";

type Props = {
  user: {
    id: string;
    role: string;
    proStatus: string | null;
  };
};

export default function UserActions({ user }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleAction(action: string) {
    setLoading(action);

    try {
      const res = await fetch("/api/admin/users/" + user.id, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        startTransition(() => router.refresh());
      } else {
        const msg = await res.text();
        alert(msg || "Action failed");
      }
    } catch {
      alert("Error performing action");
    } finally {
      setLoading(null);
    }
  }

  async function handleImpersonate() {
    if (!confirm("Impersonate this user? You will be logged in as them.")) return;
    setLoading("impersonate");

    try {
      const res = await fetch("/api/admin/users/" + user.id + "/impersonate", {
        method: "POST",
      });

      if (res.ok) {
        window.location.href = "/";
      } else {
        alert("Failed to impersonate user");
      }
    } catch {
      alert("Error impersonating user");
    } finally {
      setLoading(null);
    }
  }

  const isPro = user.role === "PRO";
  const isPending_ = user.proStatus === "PENDING";

  return (
    <div className="space-y-3">
      <button
        onClick={handleImpersonate}
        disabled={isPending || loading !== null}
        className={ctaPrimary + " w-full justify-center"}
      >
        {loading === "impersonate" ? "Logging in..." : "Impersonate User"}
      </button>

      {isPro && isPending_ && (
        <>
          <button
            onClick={() => handleAction("approve")}
            disabled={isPending || loading !== null}
            className={ctaPrimary + " w-full justify-center bg-emerald-600 hover:bg-emerald-500"}
          >
            {loading === "approve" ? "Approving..." : "Approve Pro"}
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={isPending || loading !== null}
            className={ctaDanger + " w-full justify-center"}
          >
            {loading === "reject" ? "Rejecting..." : "Reject Pro"}
          </button>
        </>
      )}

      <div className="pt-3 border-t border-white/10">
        <button
          onClick={() => {
            if (confirm("Are you sure you want to delete this user? This cannot be undone.")) {
              handleAction("delete");
            }
          }}
          disabled={isPending || loading !== null}
          className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/20"
        >
          {loading === "delete" ? "Deleting..." : "Delete User"}
        </button>
      </div>
    </div>
  );
}