"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { glass, textMeta, ctaPrimary, ctaDanger } from "@/lib/glass";
import {
  Building2,
  Phone,
  FileCheck,
  Globe,
  MapPin,
  Wrench,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
} from "lucide-react";

type ProType = "CONTRACTOR" | "REALTOR" | "INSPECTOR";

type Contractor = {
  id: string;
  name: string | null;
  email: string;
  proStatus: string | null;
  createdAt: string;
  proProfile: {
    businessName: string | null;
    type: ProType | null;
    phone: string | null;
    licenseNo: string | null;
    website: string | null;
    bio: string | null;
    serviceAreas: string[];
    specialties: string[];
  } | null;
};

function prettyType(t: ProType | null | undefined): string {
  if (!t) return "Professional";
  return t.charAt(0) + t.slice(1).toLowerCase();
}

function getHref(url: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    return "https://" + url;
  }
}

type InfoItemProps = {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
};

function InfoItem({ icon: Icon, label, value }: InfoItemProps) {
  return (
    <div className="rounded-lg bg-white/5 px-3 py-2">
      <div className="mb-0.5 flex items-center gap-1.5">
        <Icon size={12} className="text-white/50" />
        <span className={"text-xs " + textMeta}>{label}</span>
      </div>
      <p className="text-sm font-medium text-white">{value || "—"}</p>
    </div>
  );
}

export default function ContractorCard({
  contractor,
  showActions,
}: {
  contractor: Contractor;
  showActions: boolean;
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [, startTransition] = useTransition();

  const statusColors: Record<string, string> = {
    PENDING: "border-amber-400/40 bg-amber-500/10 text-amber-200",
    APPROVED: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200",
    REJECTED: "border-red-400/40 bg-red-500/10 text-red-200",
  };

  const statusIcons: Record<string, React.ElementType> = {
    PENDING: Clock,
    APPROVED: CheckCircle,
    REJECTED: XCircle,
  };

  const status = contractor.proStatus || "PENDING";
  const StatusIcon = statusIcons[status] || Clock;

  async function handleApprove() {
    if (!confirm("Approve this professional application?")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/pro-applications/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: contractor.id }),
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
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!confirm("Reject this professional application?")) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/pro-applications/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: contractor.id }),
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
      setProcessing(false);
    }
  }

  const profile = contractor.proProfile;
  const displayName = profile?.businessName || contractor.name || contractor.email;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className={glass + " flex flex-col"}>
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-lg font-bold text-white">
            {initial}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              {profile?.businessName || contractor.name || "Unnamed"}
            </h3>
            <p className={"text-sm " + textMeta}>{contractor.email}</p>
          </div>
        </div>
        <span className={"inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium " + statusColors[status]}>
          <StatusIcon size={12} />
          {status}
        </span>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <InfoItem icon={Building2} label="Type" value={prettyType(profile?.type)} />
        <InfoItem icon={Phone} label="Phone" value={profile?.phone} />
        <InfoItem icon={FileCheck} label="License" value={profile?.licenseNo} />
        <InfoItem icon={Clock} label="Applied" value={new Date(contractor.createdAt).toLocaleDateString()} />
      </div>

      {profile?.website && (
        <div className="mb-4">
          <a
            href={getHref(profile.website)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300"
          >
            <Globe size={14} />
            {profile.website}
            <ExternalLink size={12} />
          </a>
        </div>
      )}

      {profile?.serviceAreas && profile.serviceAreas.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <MapPin size={14} className="text-white/50" />
            <span className={"text-xs " + textMeta}>Service Areas</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.serviceAreas.map((area) => (
              <span key={area} className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/80">
                {area}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile?.specialties && profile.specialties.length > 0 && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center gap-1.5">
            <Wrench size={14} className="text-white/50" />
            <span className={"text-xs " + textMeta}>Specialties</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {profile.specialties.map((item) => (
              <span key={item} className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs text-white/80">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile?.bio && (
        <div className="mb-4">
          <p className={"text-sm leading-relaxed " + textMeta}>{profile.bio}</p>
        </div>
      )}

      {showActions && (
        <div className="mt-auto flex gap-2 border-t border-white/10 pt-4">
          <button
            onClick={handleApprove}
            disabled={processing}
            className={ctaPrimary + " flex-1 justify-center bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600"}
          >
            {processing ? "Processing..." : "Approve"}
          </button>
          <button
            onClick={handleReject}
            disabled={processing}
            className={ctaDanger + " flex-1 justify-center"}
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}