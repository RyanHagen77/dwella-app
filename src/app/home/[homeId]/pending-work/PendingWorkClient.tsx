// app/home/[homeId]/pending-work/PendingWorkClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// At the top of PendingWorkClient.tsx, update the type:
type PendingWorkItem = {
  id: string;
  workType: string;
  workDate: Date;
  description: string | null;
  cost: number | null;
  photos: string[];
  attachments: Array<{  // ✅ Add this
    id: string;
    filename: string;
    url: string;
    mimeType: string;
    size: number;
  }>;
  invoiceUrl: string | null;
  warrantyIncluded: boolean;
  warrantyLength: string | null;
  warrantyDetails: string | null;
  status: string;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
      company: string | null;
      phone: string | null;
      rating: number | null;
      completedJobs: number;
      verified: boolean;
    } | null;
  };
  invitation: {
    id: string;
    message: string | null;
  } | null;
};

export default function PendingWorkClient({
  homeId,
  homeAddress,
  pendingWork,
}: {
  homeId: string;
  homeAddress: string;
  pendingWork: PendingWorkItem[];
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleVerify(workRecordId: string) {
    setProcessing(workRecordId);
    try {
      const response = await fetch(
        `/api/home/${homeId}/records/${workRecordId}/verify-work`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "VERIFY" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to verify work");
      }

      router.refresh();
    } catch (error) {
      console.error("Error verifying work:", error);
      alert("Failed to verify work. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleDispute(workRecordId: string) {
    const feedback = prompt("Please provide details about your dispute:");
    if (!feedback) return;

    setProcessing(workRecordId);
    try {
      const response = await fetch(
        `/api/home/${homeId}/records/${workRecordId}/verify-work`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "DISPUTE", feedback }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to dispute work");
      }

      router.refresh();
    } catch (error) {
      console.error("Error disputing work:", error);
      alert("Failed to dispute work. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(workRecordId: string) {
    const feedback = prompt("Please provide a reason for rejection:");
    if (!feedback) return;

    setProcessing(workRecordId);
    try {
      const response = await fetch(
        `/api/home/${homeId}/records/${workRecordId}/verify-work`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "REJECT", feedback }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject work");
      }

      router.refresh();
    } catch (error) {
      console.error("Error rejecting work:", error);
      alert("Failed to reject work. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  if (pendingWork.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Pending Work Verification</h1>
        <p className="text-gray-600 mb-4">{homeAddress}</p>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No pending work to verify at this time.</p>
          <a
            href={`/home/${homeId}`}
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <a
          href={`/home/${homeId}`}
          className="text-blue-600 hover:underline mb-2 inline-block"
        >
          ← Back to Home
        </a>
        <h1 className="text-2xl font-bold">Pending Work Verification</h1>
        <p className="text-gray-600">{homeAddress}</p>
        <p className="text-sm text-gray-500 mt-1">
          {pendingWork.length} {pendingWork.length === 1 ? "item" : "items"} awaiting
          verification
        </p>
      </div>

      <div className="space-y-6">
        {pendingWork.map((work) => (
          <div key={work.id} className="bg-white rounded-lg shadow-md p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{work.workType}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(work.workDate).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                {work.cost !== null && (
                  <p className="text-lg font-bold">
                    ${work.cost.toFixed(2)}
                  </p>
                )}
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    work.status === "DISPUTED"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {work.status}
                </span>
              </div>
            </div>

            {/* Contractor Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                {work.contractor.image && (
                  <Image
                    src={work.contractor.image}
                    alt={work.contractor.name || "Contractor"}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">
                    {work.contractor.name || work.contractor.email}
                  </p>
                  {work.contractor.proProfile && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>
                        {work.contractor.proProfile.businessName ||
                          work.contractor.proProfile.company}
                      </span>
                      {work.contractor.proProfile.rating && (
                        <span>⭐ {work.contractor.proProfile.rating}</span>
                      )}
                      {work.contractor.proProfile.verified && (
                        <span className="text-green-600">✓ Verified</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {work.description && (
              <div className="mb-4">
                <h3 className="font-medium text-sm text-gray-700 mb-1">
                  Description
                </h3>
                <p className="text-gray-600">{work.description}</p>
              </div>
            )}

            {/* Warranty Info */}
            {work.warrantyIncluded && (
              <div className="mb-4 p-3 bg-green-50 rounded">
                <h3 className="font-medium text-sm text-green-800 mb-1">
                  ✓ Warranty Included
                </h3>
                {work.warrantyLength && (
                  <p className="text-sm text-gray-700">
                    Length: {work.warrantyLength}
                  </p>
                )}
                {work.warrantyDetails && (
                  <p className="text-sm text-gray-600">{work.warrantyDetails}</p>
                )}
              </div>
            )}

            {/* Photos - show both legacy and new attachments */}
            {(work.photos.length > 0 || work.attachments.length > 0) && (
              <div className="mb-4">
                <h3 className="font-medium text-sm text-gray-700 mb-2">
                  Photos ({work.photos.length + work.attachments.filter(a => a.mimeType?.startsWith('image/')).length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {/* Legacy photos */}
                  {work.photos.map((photo, idx) => (
                    <Image
                      key={`photo-${idx}`}
                      src={photo}
                      alt={`Work photo ${idx + 1}`}
                      width={200}
                      height={200}
                      className="rounded object-cover w-full h-32"
                    />
                  ))}
                  {/* New attachments (images only) */}
                  {work.attachments
                    .filter(a => a.mimeType?.startsWith('image/'))
                    .map((attachment) => (
                      <Image
                        key={attachment.id}
                        src={attachment.url}
                        alt={attachment.filename}
                        width={200}
                        height={200}
                        className="rounded object-cover w-full h-32"
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Invoice */}
            {work.invoiceUrl && (
              <div className="mb-4">
                <a
                  href={work.invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  📄 View Invoice
                </a>
              </div>
            )}

            {/* Message from invitation */}
            {work.invitation?.message && (
              <div className="mb-4 p-3 bg-blue-50 rounded">
                <h3 className="font-medium text-sm text-blue-800 mb-1">
                  Message from Contractor
                </h3>
                <p className="text-sm text-gray-700">{work.invitation.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-4 pt-4 border-t">
              <button
                onClick={() => handleVerify(work.id)}
                disabled={processing === work.id}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {processing === work.id ? "Processing..." : "✓ Verify & Approve"}
              </button>
              <button
                onClick={() => handleDispute(work.id)}
                disabled={processing === work.id}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                ⚠ Dispute
              </button>
              <button
                onClick={() => handleReject(work.id)}
                disabled={processing === work.id}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                ✗ Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}