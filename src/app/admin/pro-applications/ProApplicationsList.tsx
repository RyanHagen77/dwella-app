"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProType = "CONTRACTOR" | "REALTOR" | "INSPECTOR";

type Application = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string; // ISO string
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
    // eslint-disable-next-line no-alert
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
        // eslint-disable-next-line no-alert
        alert(msg || "Failed to approve");
      }
    } catch {
      // eslint-disable-next-line no-alert
      alert("Error approving application");
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId: string) => {
    // eslint-disable-next-line no-alert
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
        // eslint-disable-next-line no-alert
        alert(msg || "Failed to reject");
      }
    } catch {
      // eslint-disable-next-line no-alert
      alert("Error rejecting application");
    } finally {
      setProcessing(null);
    }
  };

  if (applications.length === 0) {
    return (
      <div
        style={{
          padding: "32px",
          textAlign: "center",
          backgroundColor: "#f9fafb",
          borderRadius: "8px",
        }}
      >
        <p style={{ color: "#6b7280" }}>No pending applications</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {applications.map((app) => (
        <div
          key={app.id}
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              marginBottom: "16px",
              display: "flex",
              alignItems: "start",
              justifyContent: "space-between",
            }}
          >
            <div>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#111827",
                  marginBottom: "4px",
                }}
              >
                {app.name || "No name"}
              </h3>
              <p style={{ color: "#6b7280", marginBottom: "4px" }}>{app.email}</p>
              <p style={{ fontSize: "14px", color: "#9ca3af" }}>
                Applied: {new Date(app.createdAt).toLocaleDateString()}
              </p>
            </div>
            <span
              style={{
                backgroundColor: "#fef3c7",
                color: "#92400e",
                padding: "4px 12px",
                borderRadius: "9999px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              Pending
            </span>
          </div>

          <div
            style={{
              marginBottom: "16px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
            }}
          >
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                Business Name
              </p>
              <p style={{ fontWeight: 500 }}>{app.proProfile?.businessName || "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                Type
              </p>
              <p style={{ fontWeight: 500 }}>{prettyType(app.proProfile?.type)}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                Phone
              </p>
              <p style={{ fontWeight: 500 }}>{app.proProfile?.phone || "—"}</p>
            </div>
            <div>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                License
              </p>
              <p style={{ fontWeight: 500 }}>{app.proProfile?.licenseNo || "—"}</p>
            </div>
          </div>

          {app.proProfile?.website && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                Website
              </p>
              <a
                href={withProtocol(app.proProfile.website)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: "#2563eb",
                  textDecoration: "underline",
                  wordBreak: "break-all",
                }}
              >
                {app.proProfile.website}
              </a>
            </div>
          )}

          {app.proProfile?.bio && (
            <div style={{ marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", marginBottom: "4px" }}>
                Bio
              </p>
              <p style={{ color: "#374151" }}>{app.proProfile.bio}</p>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              borderTop: "1px solid #d1d5db",
              paddingTop: "16px",
              marginTop: "16px",
            }}
          >
            <button
              onClick={() => handleApprove(app.id)}
              disabled={processing === app.id}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: processing === app.id ? "#9ca3af" : "#16a34a",
                color: "white",
                borderRadius: "8px",
                fontWeight: 500,
                border: "none",
                cursor: processing === app.id ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              {processing === app.id ? "Processing..." : "Approve"}
            </button>
            <button
              onClick={() => handleReject(app.id)}
              disabled={processing === app.id}
              style={{
                flex: 1,
                padding: "12px 16px",
                backgroundColor: processing === app.id ? "#9ca3af" : "#dc2626",
                color: "white",
                borderRadius: "8px",
                fontWeight: 500,
                border: "none",
                cursor: processing === app.id ? "not-allowed" : "pointer",
                fontSize: "14px",
              }}
            >
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}