"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { glass } from "@/lib/glass";

type ServiceRequestForContractor = {
  id: string;
  status: string;
  quote: { id: string } | null;
  workRecord: { id: string } | null;
  contractorNotes: string | null;
};

export function ContractorServiceRequestActions({
  serviceRequest,
}: {
  serviceRequest: ServiceRequestForContractor;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const canSubmitQuote = serviceRequest.status === "PENDING" && !serviceRequest.quote;
  const canEditQuote = serviceRequest.status === "QUOTED" && serviceRequest.quote;
  const isAccepted = serviceRequest.status === "ACCEPTED";

  async function handleDecline() {
    if (!confirm("Are you sure you want to decline this job request?")) {
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/contractor/service-requests/${serviceRequest.id}/decline`,
        {
          method: "POST",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to decline");
      }

      router.refresh();
    } catch (error) {
      console.error("Error declining:", error);
      alert("Failed to decline job request");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className={glass}>
      <div className="space-y-3">
        {canSubmitQuote && (
          <button
            type="button"
            onClick={() => router.push(`/contractor/service-requests/${serviceRequest.id}/quote`)}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Submit Quote
          </button>
        )}

        {canEditQuote && (
          <button
            type="button"
            onClick={() => router.push(`/contractor/service-requests/${serviceRequest.id}/quote/edit`)}
            className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
          >
            Edit Quote
          </button>
        )}

        {isAccepted && !serviceRequest.workRecord && (
          <button
            type="button"
            onClick={() => router.push(`/contractor/service-requests/${serviceRequest.id}/start-work`)}
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Start Work
          </button>
        )}

        <button
          type="button"
          onClick={() => router.push(`/contractor/service-requests/${serviceRequest.id}/notes`)}
          className="w-full rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
        >
          {serviceRequest.contractorNotes ? "Edit Notes" : "Add Notes"}
        </button>

        {serviceRequest.status === "PENDING" && (
          <button
            type="button"
            onClick={handleDecline}
            disabled={isLoading}
            className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300 hover:bg-red-500/20 disabled:opacity-50"
          >
            {isLoading ? "Declining..." : "Decline Request"}
          </button>
        )}
      </div>
    </section>
  );
}