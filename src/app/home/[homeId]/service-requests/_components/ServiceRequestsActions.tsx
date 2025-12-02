// app/stats/[homeId]/service-requests/_components/ServiceRequestsActions.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { glass, heading, textMeta } from "@/lib/glass";
import { Button } from "@/components/ui/Button";
import type { ServiceRequestForActions } from "../_types";

type Props = {
  serviceRequest: ServiceRequestForActions;
  homeId: string;
};

export function ServiceRequestsActions({ serviceRequest, homeId }: Props) {
  const router = useRouter();
  const [acting, setActing] = useState(false);

  const canAccept = serviceRequest.status === "QUOTED" && !!serviceRequest.quoteId;
  const canCancel = ["PENDING", "QUOTED"].includes(serviceRequest.status);

  async function handleAccept() {
    if (!confirm("Accept this quote and proceed with the work?")) return;

    setActing(true);
    try {
      const res = await fetch(
        `/api/home/${homeId}/service-requests/${serviceRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACCEPTED" }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to accept quote");
      }

      router.refresh();
    } catch (error) {
      console.error("Error accepting quote:", error);
      alert(
        error instanceof Error ? error.message : "Failed to accept quote"
      );
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this service request?")) return;

    setActing(true);
    try {
      const res = await fetch(
        `/api/home/${homeId}/service-requests/${serviceRequest.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "CANCELLED" }),
        }
      );

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to cancel request");
      }

      router.push(`/home/${homeId}/service-requests`);
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert(
        error instanceof Error ? error.message : "Failed to cancel request"
      );
    } finally {
      setActing(false);
    }
  }

  function handleMessage() {
    // TODO: real messaging hook-up
    alert("Messaging coming soon!");
  }

  return (
    <section className={glass}>
      <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Actions</h2>
      <div className="space-y-3">
        {/* Accept Quote */}
        {canAccept && (
          <Button
            onClick={handleAccept}
            disabled={acting}
            className="w-full"
          >
            {acting ? "Accepting..." : "Accept Quote"}
          </Button>
        )}

        {/* Message Contractor */}
        <button
          type="button"
          onClick={handleMessage}
          className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm font-medium text-white hover:bg-white/10"
        >
          Message Contractor
        </button>

        {/* Cancel Request */}
        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={acting}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            {acting ? "Cancelling..." : "Cancel Request"}
          </button>
        )}

        {/* Status helper text */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <p className={`text-xs ${textMeta}`}>
            {serviceRequest.status === "PENDING" && (
              <>Waiting for contractor to respond with a quote.</>
            )}
            {serviceRequest.status === "QUOTED" && (
              <>Review the quote and accept to proceed with the work.</>
            )}
            {serviceRequest.status === "ACCEPTED" && (
              <>Quote accepted. Contractor will begin work soon.</>
            )}
            {serviceRequest.status === "IN_PROGRESS" && (
              <>Work is currently in progress.</>
            )}
            {serviceRequest.status === "COMPLETED" && (
              <>Work has been completed. Check the work record for details.</>
            )}
            {serviceRequest.status === "DECLINED" && (
              <>Contractor declined this request.</>
            )}
            {serviceRequest.status === "CANCELLED" && (
              <>This request has been cancelled.</>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}