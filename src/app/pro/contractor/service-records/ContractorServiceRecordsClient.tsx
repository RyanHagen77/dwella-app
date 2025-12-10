"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { glass, heading, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { Input } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import AddressVerification from "@/components/AddressVerification";
import { InviteHomeownerButton } from "@/app/pro/_components/InviteHomeownerButton";

type ServiceRecord = {
  id: string;
  homeId: string;
  homeAddress: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  homeownerName: string;
  serviceType: string;
  serviceDate: string;
  cost: number | null;
  status: string;
  isVerified: boolean;
  description: string | null;
  photos: string[];
  createdAt: string;
};

type ContractorServiceRecordsClientProps = {
  serviceRecords: ServiceRecord[];
};

export default function ContractorServiceRecordsClient({
  serviceRecords,
}: ContractorServiceRecordsClientProps) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "verified">("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const counts = useMemo(
    () => ({
      all: serviceRecords.length,
      pending: serviceRecords.filter((r) => !r.isVerified).length,
      verified: serviceRecords.filter((r) => r.isVerified).length,
    }),
    [serviceRecords]
  );

  const filtered = useMemo(() => {
    let list = [...serviceRecords];

    if (filter === "pending") {
      list = list.filter((r) => !r.isVerified);
    }
    if (filter === "verified") {
      list = list.filter((r) => r.isVerified);
    }

    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.serviceType.toLowerCase().includes(t) ||
          r.homeAddress.toLowerCase().includes(t) ||
          r.homeownerName.toLowerCase().includes(t)
      );
    }

    return list.sort((a, b) => {
      if (!a.isVerified && b.isVerified) return -1;
      if (a.isVerified && !b.isVerified) return 1;
      return (
        new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime()
      );
    });
  }, [serviceRecords, q, filter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={glass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className={`text-2xl font-semibold ${heading}`}>
              Service Records
            </h1>
            <p className={`mt-1 ${textMeta}`}>
              Track and manage all documented service across your properties —
              whether or not the homeowner is connected.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pro/contractor/service-records/new"
              className={ctaPrimary}
            >
              + Document Service
            </Link>
            <InviteHomeownerButton />
          </div>
        </div>
      </div>

      {/* Filters */}
      <section className={glass}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Chip active={filter === "all"} onClick={() => setFilter("all")}>
              All ({counts.all})
            </Chip>
            <Chip
              active={filter === "pending"}
              onClick={() => setFilter("pending")}
            >
              Pending Verification ({counts.pending})
            </Chip>
            <Chip
              active={filter === "verified"}
              onClick={() => setFilter("verified")}
            >
              Verified ({counts.verified})
            </Chip>
          </div>
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search service records..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Service Records List */}
      <section className={glass}>
        {filtered.length === 0 ? (
          <div className="py-10 text-center text-white/80">
            <div className="mb-4 text-5xl">📋</div>
            <p className="mb-2 text-lg">No service records</p>
            <p className={`mb-4 ${textMeta}`}>
              {q || filter !== "all"
                ? "No service records match your filters."
                : "Start documenting completed service for any property you work on."}
            </p>
            {q || filter !== "all" ? (
              <button
                className={ctaGhost}
                onClick={() => {
                  setQ("");
                  setFilter("all");
                }}
              >
                Clear filters
              </button>
            ) : (
              <Link
                href="/pro/contractor/service-records/new"
                className={ctaPrimary}
              >
                Document Service
              </Link>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-white/10">
            {filtered.map((record) => (
              <ServiceRecordItem key={record.id} record={record} />
            ))}
          </ul>
        )}
      </section>

      {/* Invite Modal (if you still want an inline version) */}
      {inviteOpen && <InviteHomeownerModal onClose={() => setInviteOpen(false)} />}
    </div>
  );
}

function ServiceRecordItem({ record }: { record: ServiceRecord }) {
  return (
    <li className="-mx-3">
      <Link
        href={`/pro/contractor/service-records/${record.id}`}
        className="group block rounded-xl px-3 py-4 transition-colors hover:bg-white/5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="font-medium text-white group-hover:opacity-95">
                {record.serviceType}
              </h3>
              <StatusBadge
                status={record.status}
                isVerified={record.isVerified}
              />
            </div>

            <p className={`mb-1 text-sm ${textMeta}`}>
              🏠 {record.homeAddress}
              {record.city && `, ${record.city}`}
              {record.state && `, ${record.state}`}
            </p>

            <p className={`text-sm ${textMeta}`}>
              👤 {record.homeownerName} • 📅{" "}
              {new Date(record.serviceDate).toLocaleDateString()}
              {record.cost != null && ` • 💰 $${record.cost.toFixed(2)}`}
            </p>

            {record.description && (
              <p
                className={`mt-2 line-clamp-2 text-sm italic ${textMeta}`}
              >
                {record.description}
              </p>
            )}

            {record.photos.length > 0 && (
              <p className={`mt-1 text-xs ${textMeta}`}>
                📷 {record.photos.length} photo
                {record.photos.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-end gap-2">
            <span className={`text-xs ${textMeta}`}>
              {new Date(record.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Link>
    </li>
  );
}

function StatusBadge({
  status,
  isVerified,
}: {
  status: string;
  isVerified: boolean;
}) {
  if (isVerified) {
    return (
      <span className="rounded-full border border-green-400/30 bg-green-400/10 px-2 py-0.5 text-xs text-green-300">
        ✓ Verified
      </span>
    );
  }

  const config: Record<string, { label: string; color: string }> = {
    DOCUMENTED_UNVERIFIED: {
      label: "Pending Verification",
      color: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30",
    },
    DOCUMENTED: {
      label: "Awaiting Review",
      color: "bg-blue-400/10 text-blue-300 border-blue-400/30",
    },
    DISPUTED: {
      label: "Disputed",
      color: "bg-red-400/10 text-red-300 border-red-400/30",
    },
  };

  const { label, color } =
    config[status] || {
      label: status,
      color: "bg-gray-400/10 text-gray-300 border-gray-400/30",
    };

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {label}
    </span>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active
          ? "border-white/40 bg-white/15 text-white"
          : "border-white/20 bg-white/5 text-white/80 hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

// (Optional) This modal is redundant with InviteHomeownerButton,
// but keeping it if you still want a local invite flow.
function InviteHomeownerModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"email" | "address" | "message">("email");
  const [email, setEmail] = useState("");
  const [verifiedAddress, setVerifiedAddress] = useState<{
    street: string;
    unit?: string;
    city: string;
    state: string;
    zip: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!verifiedAddress) return;

    setLoading(true);

    try {
      const fullAddress = `${verifiedAddress.street}${
        verifiedAddress.unit ? ` ${verifiedAddress.unit}` : ""
      }, ${verifiedAddress.city}, ${verifiedAddress.state} ${
        verifiedAddress.zip
      }`;

      const response = await fetch("/api/pro/contractor/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invitedEmail: email,
          homeAddress: fullAddress,
          message,
          role: "HOMEOWNER",
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || "Failed to send invitation");
      }

      alert("Invitation sent successfully!");
      onClose();
      window.location.reload();
    } catch (error) {
      console.error("Error sending invitation:", error);
      alert(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={true} onCloseAction={onClose}>
      <div className="p-6">
        <h2 className="mb-4 text-xl font-bold text-white">Invite Homeowner</h2>

        {/* Step Indicator */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <StepDot
            active={step === "email"}
            completed={step !== "email"}
            label="1"
          />
          <div className="h-0.5 w-8 bg-white/20" />
          <StepDot
            active={step === "address"}
            completed={step === "message"}
            label="2"
          />
          <div className="h-0.5 w-8 bg-white/20" />
          <StepDot active={step === "message"} label="3" />
        </div>

        {/* Step 1: Email */}
        {step === "email" && (
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Homeowner Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="homeowner@example.com"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("address")}
                disabled={!email || !email.includes("@")}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                Next: Verify Address
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Address Verification */}
        {step === "address" && (
          <div className="space-y-4">
            <AddressVerification
              onVerified={(address) => {
                setVerifiedAddress(address);
                setStep("message");
              }}
            />
            <button
              onClick={() => setStep("email")}
              className="text-sm text-white/70 hover:text-white"
            >
              ← Back
            </button>
          </div>
        )}

        {/* Step 3: Message */}
        {step === "message" && (
          <div className="space-y-4">
            <div className="rounded-lg border border-white/20 bg-white/5 p-3">
              <p className="mb-1 text-xs text-white/60">Verified Address:</p>
              <p className="text-sm font-medium text-white">
                {verifiedAddress?.street}
                {verifiedAddress?.unit && ` ${verifiedAddress.unit}`}
              </p>
              <p className="text-sm text-white">
                {verifiedAddress?.city}, {verifiedAddress?.state}{" "}
                {verifiedAddress?.zip}
              </p>
              <button
                onClick={() => setStep("address")}
                className="mt-2 text-xs text-white/70 hover:text-white"
              >
                Change address
              </button>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-white">
                Message (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a personal message to the homeowner..."
                className="w-full rounded-md border border-white/15 bg-white/10 px-4 py-2 text-white outline-none backdrop-blur placeholder:text-white/40"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStep("address")}
                disabled={loading}
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white hover:bg-white/10"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2 font-medium text-white hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

function StepDot({
  active,
  completed,
  label,
}: {
  active?: boolean;
  completed?: boolean;
  label: string;
}) {
  return (
    <div
      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
        completed
          ? "bg-green-400/20 text-green-300"
          : active
          ? "bg-orange-400/20 text-orange-300"
          : "bg-white/10 text-white/40"
      }`}
    >
      {completed ? "✓" : label}
    </div>
  );
}