"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Image from "next/image";
import { glass, heading, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, fieldLabel } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";

/* ------------ Types ------------ */
type WorkRequestStatus = "pending_acceptance" | "ready_to_document" | "documented" | "approved";

type WorkRequest = {
  id: string;
  homeownerName: string;
  homeAddress: string;
  workType: string;
  workDate: string;
  status: WorkRequestStatus;
  requestedAt: string;
  message?: string;
};

const MOCK_REQUESTS: WorkRequest[] = [
  {
    id: "1",
    homeownerName: "Jane Smith",
    homeAddress: "354 S Tryon St, Woodstock, IL",
    workType: "Chimney Sweep & Inspection",
    workDate: "2024-10-15",
    status: "ready_to_document",
    requestedAt: "2024-11-01",
    message: "Please add the chimney work you did last month to my home record."
  },
  {
    id: "2",
    homeownerName: "Mike Johnson",
    homeAddress: "1842 Maple Ave, Chicago, IL",
    workType: "HVAC Annual Service",
    workDate: "2024-09-20",
    status: "documented",
    requestedAt: "2024-10-15",
  },
  {
    id: "3",
    homeownerName: "Sarah Williams",
    homeAddress: "92 Oak Street, Evanston, IL",
    workType: "Furnace Replacement",
    workDate: "2024-08-10",
    status: "approved",
    requestedAt: "2024-09-01",
  }
];

export default function WorkRequestsPage() {
  const [requests] = useState<WorkRequest[]>(MOCK_REQUESTS);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "action_needed" | "documented">("all");
  const [inviteOpen, setInviteOpen] = useState(false);

  const counts = useMemo(() => ({
    all: requests.length,
    action_needed: requests.filter(r => r.status === "ready_to_document").length,
    documented: requests.filter(r => r.status === "documented" || r.status === "approved").length,
  }), [requests]);

  const filtered = useMemo(() => {
    let list = requests;

    if (filter === "action_needed") {
      list = list.filter(r => r.status === "ready_to_document");
    }
    if (filter === "documented") {
      list = list.filter(r => r.status === "documented" || r.status === "approved");
    }

    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(r =>
        r.homeownerName.toLowerCase().includes(t) ||
        r.homeAddress.toLowerCase().includes(t) ||
        r.workType.toLowerCase().includes(t)
      );
    }

    return [...list].sort((a, b) => {
      if (a.status === "ready_to_document" && b.status !== "ready_to_document") return -1;
      if (b.status === "ready_to_document" && a.status !== "ready_to_document") return 1;
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });
  }, [requests, q, filter]);

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-7xl p-6 space-y-6">

        <div className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className={`text-2xl font-semibold ${heading}`}>Work Requests</h1>
              <p className={`mt-1 ${textMeta}`}>
                Homeowners inviting you to document your work on their properties
              </p>
            </div>
            <button className={ctaPrimary} onClick={() => setInviteOpen(true)}>
              Invite Homeowner
            </button>
          </div>
        </div>

        <section className={glass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>
                All ({counts.all})
              </Chip>
              <Chip active={filter === "action_needed"} onClick={() => setFilter("action_needed")}>
                Action Needed ({counts.action_needed})
              </Chip>
              <Chip active={filter === "documented"} onClick={() => setFilter("documented")}>
                Documented ({counts.documented})
              </Chip>
            </div>
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search requests..."
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className={glass}>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-white/80">
              <div className="mb-4 text-5xl">📋</div>
              <p className="mb-2 text-lg">No work requests</p>
              <p className={`mb-4 ${textMeta}`}>
                {q || filter !== "all"
                  ? "No requests match your filters"
                  : "Invite homeowners to start documenting your work"}
              </p>
              {(q || filter !== "all") ? (
                <button className={ctaGhost} onClick={() => { setQ(""); setFilter("all"); }}>
                  Clear filters
                </button>
              ) : (
                <button className={ctaPrimary} onClick={() => setInviteOpen(true)}>
                  Invite Homeowner
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((req) => (
                <WorkRequestItem key={req.id} request={req} />
              ))}
            </ul>
          )}
        </section>

        <InviteHomeownerModal
          open={inviteOpen}
          onCloseAction={() => setInviteOpen(false)}
        />
      </div>
    </main>
  );
}

function WorkRequestItem({ request }: { request: WorkRequest }) {
  return (
    <li className="-mx-3">
      <Link
        href={`/pro/work/${request.id}`}
        className="group block rounded-xl px-3 py-4 transition-colors hover:bg-white/5"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-white group-hover:opacity-95">
                {request.workType}
              </h3>
              <StatusBadge status={request.status} />
            </div>

            <p className={`text-sm ${textMeta} mb-1`}>
              🏠 {request.homeAddress}
            </p>

            <p className={`text-sm ${textMeta}`}>
              👤 {request.homeownerName} • 📅 Work done {new Date(request.workDate).toLocaleDateString()}
            </p>

            {request.message && (
              <p className={`mt-2 text-sm italic ${textMeta}`}>
                &ldquo;{request.message}&rdquo;
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <span className={`text-xs ${textMeta}`}>
              Requested {new Date(request.requestedAt).toLocaleDateString()}
            </span>

            {request.status === "ready_to_document" && (
              <button
                className={ctaPrimary}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                Document Work
              </button>
            )}
          </div>
        </div>
      </Link>
    </li>
  );
}

function StatusBadge({ status }: { status: WorkRequestStatus }) {
  const config = {
    pending_acceptance: { label: "Pending", color: "bg-yellow-400/10 text-yellow-300 border-yellow-400/30" },
    ready_to_document: { label: "Ready", color: "bg-blue-400/10 text-blue-300 border-blue-400/30" },
    documented: { label: "Documented", color: "bg-purple-400/10 text-purple-300 border-purple-400/30" },
    approved: { label: "Approved", color: "bg-green-400/10 text-green-300 border-green-400/30" },
  };

  const { label, color } = config[status];

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${color}`}>
      {label}
    </span>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
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

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}

function InviteHomeownerModal({ open, onCloseAction }: { open: boolean; onCloseAction: () => void }) {
  const [form, setForm] = useState({
    homeownerEmail: "",
    homeAddress: "",
    workType: "",
    workDate: new Date().toISOString().slice(0, 10),
    message: ""
  });

  function submit() {
    if (!form.homeownerEmail.trim() || !form.homeAddress.trim() || !form.workType.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    console.log("Sending invitation:", form);
    alert("Invitation sent! The homeowner will receive an email.");
    onCloseAction();
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Invite Homeowner">
      <div className="space-y-3">
        <p className={`text-sm ${textMeta}`}>
          Invite a homeowner to let you document work you&apos;ve done on their property.
        </p>

        <label className="block">
          <span className={fieldLabel}>Homeowner Email *</span>
          <Input
            type="email"
            value={form.homeownerEmail}
            onChange={e => setForm({ ...form, homeownerEmail: e.target.value })}
            placeholder="homeowner@example.com"
          />
        </label>

        <label className="block">
          <span className={fieldLabel}>Property Address *</span>
          <Input
            value={form.homeAddress}
            onChange={e => setForm({ ...form, homeAddress: e.target.value })}
            placeholder="354 S Tryon St, Woodstock, IL"
          />
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>Work Type *</span>
            <Input
              value={form.workType}
              onChange={e => setForm({ ...form, workType: e.target.value })}
              placeholder="e.g., Chimney Sweep"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Work Date *</span>
            <Input
              type="date"
              value={form.workDate}
              onChange={e => setForm({ ...form, workDate: e.target.value })}
            />
          </label>
        </div>

        <label className="block">
          <span className={fieldLabel}>Message (Optional)</span>
          <Input
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="Add a personal message..."
          />
        </label>

        <div className="mt-4 flex justify-end gap-2">
          <GhostButton onClick={onCloseAction}>Cancel</GhostButton>
          <Button onClick={submit}>Send Invitation</Button>
        </div>
      </div>
    </Modal>
  );
}