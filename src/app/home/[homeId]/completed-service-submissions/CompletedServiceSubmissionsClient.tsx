"use client";

import * as React from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { foggyApprove, foggyReject } from "@/components/ui/foggyButtons";

/* ============================================================================
   TYPES
   ============================================================================ */

type ProProfile = {
  businessName: string | null;
  company: string | null;
  phone: string | null;
  rating: number | null;
  verified: boolean;
};

type Contractor = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  proProfile: ProProfile | null;
};

type PendingServiceAttachment = {
  id: string;
  filename: string;
  mimeType: string | null;
  size: number;
  url: string | null;
};

type PendingService = {
  id: string;
  title: string;
  description: string | null;
  serviceDate: string;
  cost: number | null;
  contractor: Contractor;
  createdAt: string;
  attachments: PendingServiceAttachment[];
};

type Quote = {
  id: string;
  totalAmount: number;
  status: string;
  expiresAt: string | null;
};

type ServiceRecord = {
  id: string;
  status: string;
  serviceDate: string;
};

type ServiceRequest = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  urgency: string;
  budgetMin: number | null;
  budgetMax: number | null;
  desiredDate: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  respondedAt: string | null;
  contractor: Contractor;
  quote: Quote | null;
  serviceRecord: ServiceRecord | null;
};

type Tab = "requests" | "submissions";

type ServiceStatusFilter =
  | "ALL"
  | "PENDING"
  | "QUOTED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DECLINED"
  | "CANCELLED";

/* ============================================================================
   STYLES
   ============================================================================ */

const styles = {
  segWrap: "inline-flex rounded-full border border-white/15 bg-black/20 p-1",
  segBtn: "rounded-full px-3 py-2 text-sm",
  segActive: "bg-black/40 text-white border border-white/20",
  segIdle: "text-white/75",

  filterToggle:
    "inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-2 text-sm text-white/85",

  filterPill: {
    base: "rounded-full border px-3 py-2 text-sm",
    active: "border-white/25 bg-black/35 text-white",
    idle: "border-white/15 bg-black/20 text-white/70",
  },

  card: "rounded-2xl border border-white/12 bg-black/25 p-5",
  cardLink: "rounded-2xl border border-white/12 bg-black/25 p-5 block",
  inset: "rounded-2xl border border-white/10 bg-black/20 p-4",
};

/* ============================================================================
   HELPERS
   ============================================================================ */

function formatDate(value?: string | null) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
}

function contractorName(c: Contractor) {
  return c.proProfile?.businessName || c.name || c.email;
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

/* ============================================================================
   CARDS
   ============================================================================ */

function ServiceRequestCard({ service, homeId }: { service: ServiceRequest; homeId: string }) {
  return (
    <Link href={`/home/${homeId}/service-requests/${service.id}`} className={styles.cardLink}>
      <h3 className="text-lg font-semibold text-white">{service.title}</h3>
      <p className="mt-1 text-sm text-white/70">{service.description}</p>

      <div className="mt-3 text-sm text-white/60">
        {contractorName(service.contractor)}
        {service.desiredDate ? ` • Desired: ${formatDate(service.desiredDate)}` : null}
      </div>
    </Link>
  );
}

function PendingServiceCard({
  service,
  homeId,
  onApprove,
  onReject,
}: {
  service: PendingService;
  homeId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className={styles.card}>
      <h3 className="text-lg font-semibold text-white">{service.title}</h3>
      <p className="mt-1 text-sm text-white/70">By {contractorName(service.contractor)}</p>

      <div className="mt-4 flex gap-2">
        <button onClick={() => onApprove(service.id)} className={foggyApprove}>
          ✓ Approve
        </button>
        <button onClick={() => onReject(service.id)} className={foggyReject}>
          ✗ Reject
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   MAIN
   ============================================================================ */

export default function CompletedServiceSubmissionsClient({
  homeId,
  requestHref,
  pendingService,
  serviceRequests,
}: {
  homeId: string;
  requestHref: string;
  pendingService: PendingService[];
  serviceRequests: ServiceRequest[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("requests");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ServiceStatusFilter>("ALL");

  const statusOptions = useMemo(
    () => [
      { label: "All", value: "ALL" },
      { label: "Pending", value: "PENDING" },
      { label: "Quoted", value: "QUOTED" },
      { label: "Accepted", value: "ACCEPTED" },
      { label: "In Progress", value: "IN_PROGRESS" },
      { label: "Completed", value: "COMPLETED" },
      { label: "Declined", value: "DECLINED" },
      { label: "Cancelled", value: "CANCELLED" },
    ],
    []
  );

  const filteredRequests =
    statusFilter === "ALL"
      ? serviceRequests
      : serviceRequests.filter((r) => r.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Tabs + Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className={styles.segWrap}>
          <button
            onClick={() => setActiveTab("requests")}
            className={`${styles.segBtn} ${activeTab === "requests" ? styles.segActive : styles.segIdle}`}
          >
            Service Requests ({serviceRequests.length})
          </button>
          <button
            onClick={() => setActiveTab("submissions")}
            className={`${styles.segBtn} ${activeTab === "submissions" ? styles.segActive : styles.segIdle}`}
          >
            Pending Submissions ({pendingService.length})
          </button>
        </div>

        {/* MOBILE ACTION ROW */}
        <div className="flex items-center gap-2 sm:hidden">
          {activeTab === "requests" && (
            <button
              onClick={() => setFiltersOpen((v) => !v)}
              className={styles.filterToggle}
            >
              <FilterIcon />
              Filters
            </button>
          )}

          <Link href={requestHref} className={ctaPrimary}>
            + Request Service
          </Link>
        </div>
      </div>

      {/* Filters (mobile collapsible, desktop always visible) */}
      {activeTab === "requests" && (
        <div className={`${filtersOpen ? "flex" : "hidden"} flex-wrap gap-2 sm:flex`}>
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setStatusFilter(opt.value as ServiceStatusFilter);
                setFiltersOpen(false);
              }}
              className={`${styles.filterPill.base} ${
                statusFilter === opt.value ? styles.filterPill.active : styles.filterPill.idle
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {activeTab === "requests" ? (
        filteredRequests.length === 0 ? (
          <p className={`text-sm ${textMeta}`}>No matching service requests.</p>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((s) => (
              <ServiceRequestCard key={s.id} service={s} homeId={homeId} />
            ))}
          </div>
        )
      ) : (
        <div className="space-y-4">
          {pendingService.map((s) => (
            <PendingServiceCard
              key={s.id}
              service={s}
              homeId={homeId}
              onApprove={() => {}}
              onReject={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}