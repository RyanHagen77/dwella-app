"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProType = "CONTRACTOR" | "REALTOR" | "INSPECTOR";

type Application = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  proProfile: {
    businessName: string | null;
    type: ProType | null;
    phone: string | null;
    licenseNo: string | null;
    website: string | null;
    bio: string | null;
  } | null;
};

function prettyType(t?: ProType | null) {
  if (!t) return "—";
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function withProtocol(url: string) {
  try {
    new URL(url);
    return url;
  } catch {
    return `https://${url}`;
  }
}

export default function ProApplicationsList({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const handleApprove = async (userId: string) => {
    if (!confirm("Approve this professional application?")) return;

    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/pro-applications/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        startTransition(() => router.refresh());
      } else {
        const msg = await res.text();
        alert(msg || "Failed to approve");
      }
    } catch {
      alert("Error approving application");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!confirm("Reject this professional application?")) return;

    setProcessing(userId);
    try {
      const res = await fetch("/api/admin/pro-applications/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        startTransition(() => router.refresh());
      } else {
        const msg = await res.text();
        alert(msg || "Failed to reject");
      }
    } catch {
      alert("Error rejecting application");
    } finally {
      setProcessing(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-lg bg-gray-50 p-8 text-center">
        <p className="text-gray-500">No pending applications</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {applications.map((app) => (
        <div
          key={app.id}
          className="rounded-lg bg-white p-6 shadow-sm"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="mb-1 text-xl font-semibold text-gray-900">
                {app.name || "No name"}
              </h3>
              <p className="mb-1 text-gray-600">{app.email}</p>
              <p className="text-sm text-gray-400">
                Applied: {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
              Pending
            </span>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-sm text-gray-600">Business Name</p>
              <p className="font-medium">{app.proProfile?.businessName || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-600">Type</p>
              <p className="font-medium">{prettyType(app.proProfile?.type)}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-600">Phone</p>
              <p className="font-medium">{app.proProfile?.phone || "—"}</p>
            </div>
            <div>
              <p className="mb-1 text-sm text-gray-600">License</p>
              <p className="font-medium">{app.proProfile?.licenseNo || "—"}</p>
            </div>
          </div>

          {app.proProfile?.website && (
            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-600">Website</p>
              <a
                href={withProtocol(app.proProfile.website)}
                target="_blank"
                rel="noopener noreferrer"
                className="break-all text-blue-600 underline hover:text-blue-700"
              >
                {app.proProfile.website}
              </a>
            </div>
          )}

          {app.proProfile?.bio && (
            <div className="mb-4">
              <p className="mb-1 text-sm text-gray-600">Bio</p>
              <p className="text-gray-700">{app.proProfile.bio}</p>
            </div>
          )}

          <div className="mt-4 flex gap-3 border-t border-gray-300 pt-4">
            <button
              onClick={() => handleApprove(app.id)}
              disabled={processing === app.id}
              className="flex-1 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {processing === app.id ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleReject(app.id)}
              disabled={processing === app.id}
              className="flex-1 rounded-lg bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}