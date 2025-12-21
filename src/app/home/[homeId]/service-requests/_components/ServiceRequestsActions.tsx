"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { glass, heading, textMeta } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
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
      const res = await fetch(`/api/home/${homeId}/service-requests/${serviceRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to accept quote");
      }

      router.refresh();
    } catch (error) {
      console.error("Error accepting quote:", error);
      alert(error instanceof Error ? error.message : "Failed to accept quote");
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this service request?")) return;

    setActing(true);
    try {
      const res = await fetch(`/api/home/${homeId}/service-requests/${serviceRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => null);
        throw new Error(error?.error || "Failed to cancel request");
      }

      router.push(`/home/${homeId}/service-requests`);
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert(error instanceof Error ? error.message : "Failed to cancel request");
    } finally {
      setActing(false);
    }
  }

  function handleMessage() {
    alert("Messaging coming soon!");
  }

  return (
    <section className={glass}>
      <h2 className={`mb-3 text-lg font-semibold ${heading}`}>Actions</h2>

      <div className="space-y-3">
        {canAccept && (
          <Button onClick={handleAccept} disabled={acting} className="w-full">
            {acting ? "Accepting..." : "Accept Quote"}
          </Button>
        )}

        <GhostButton onClick={handleMessage} disabled={acting} className="w-full">
          Message Contractor
        </GhostButton>

        {canCancel && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={acting}
            className="
              w-full rounded-full
              border border-red-400/30
              bg-red-400/15
              px-4 py-2.5
              text-sm font-medium text-red-200
              backdrop-blur
              transition-colors
              hover:bg-red-400/25 hover:border-red-400/40
              disabled:cursor-not-allowed disabled:opacity-50
            "
          >
            {acting ? "Cancelling..." : "Cancel Request"}
          </button>
        )}

        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className={`text-xs ${textMeta}`}>
            {serviceRequest.status === "PENDING" && <>Waiting for contractor to respond with a quote.</>}
            {serviceRequest.status === "QUOTED" && <>Review the quote and accept to proceed with the work.</>}
            {serviceRequest.status === "ACCEPTED" && <>Quote accepted. Contractor will begin work soon.</>}
            {serviceRequest.status === "IN_PROGRESS" && <>Work is currently in progress.</>}
            {serviceRequest.status === "COMPLETED" && <>Work has been completed. Check the work record for details.</>}
            {serviceRequest.status === "DECLINED" && <>Contractor declined this request.</>}
            {serviceRequest.status === "CANCELLED" && <>This request has been cancelled.</>}
          </p>
        </div>
      </div>
    </section>
  );
}