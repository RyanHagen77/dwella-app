// app/pro/record/[Id]/JobRecordClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { glass, glassTight, heading, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { loadJSON, saveJSON } from "@/lib/storage";

/* ---------- Types (aligned with /pro page) ---------- */
type JobStatus = "requested" | "scheduled" | "in_progress" | "complete";

type Job = {
  id: string;
  title: string;
  clientAddress: string;
  due: string;
  status: JobStatus;
  estAmount?: number;
  note?: string[];
};

type RecordItem = {
  id: string;
  title: string;
  date: string;
  address: string;
  amount?: number;
};

type ProData = {
  pro: {
    id: string;
    business: string;
    category: string;
    rating: number;
    verified: boolean;
    logo?: string;
  };
  jobs: Job[];
  records: RecordItem[];
  clients: { id: string; address: string; sharedLink: string; owner?: string }[];
  reviews: { id: string; author: string; rating: number; text: string; date: string }[];
};

export default function JobRecordClient({ id }: { id: string }) {
  const router = useRouter();
  const [db, setDb] = useState<ProData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [note, setNote] = useState("");

  // Load cached Pro data (same key as /pro)
  useEffect(() => {
    const cached = loadJSON<ProData | null>("proData", null);
    setDb(cached);
    setLoading(false);
  }, []);

  // Persist edits
  useEffect(() => { if (db) saveJSON("proData", db); }, [db]);

  // Resolve either a job id (j1) or a record id (rec-j1)
  const ctx = useMemo(() => {
    if (!db) return null;

    const jobId = id.startsWith("rec-") ? id.slice(4) : id;
    const job = db.jobs.find(j => j.id === jobId) ?? null;
    const rec = db.records.find(r => r.id === (id.startsWith("rec-") ? id : `rec-${id}`)) ?? null;

    return { job, rec };
  }, [db, id]);

  if (loading) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="h-9 w-48 animate-pulse rounded-xl bg-white/10 backdrop-blur-sm" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
        </div>
      </main>
    );
  }

  if (!db || !ctx || (!ctx.job && !ctx.rec)) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <button className={`${ctaGhost} rounded-full`} onClick={() => router.push("/pro/contractor")}>← Back to Pro</button>
          <section className={glass}>
            <h1 className={`text-xl ${heading}`}>Not found</h1>
            <p className={textMeta}>We couldn't find that job or record in your local data.</p>
          </section>
        </div>
      </main>
    );
  }

  const { job, rec } = ctx;

  /* ---------- Mutations ---------- */
  function updateJob(patch: Partial<Job>) {
    if (!job) return;
    setDb(d => {
      if (!d) return d;
      return { ...d, jobs: d.jobs.map(j => (j.id === job.id ? { ...j, ...patch } : j)) };
    });
  }

  function addNote() {
    if (!job || !note.trim()) return;
    updateJob({ note: [...(job.notes ?? []), note.trim()] });
    setNote("");
  }

  function markComplete() {
    if (!job) return;
    const today = new Date().toISOString().slice(0, 10);
    setDb(d => {
      if (!d) return d;
      const jobs = d.jobs.map(j => (j.id === job.id ? { ...j, status: "complete" } : j));
      const newRec: RecordItem = {
        id: `rec-${job.id}`,
        title: job.title,
        date: today,
        address: job.clientAddress,
        amount: job.estAmount,
      };
      const records = d.records.some(r => r.id === newRec.id)
        ? d.records.map(r => (r.id === newRec.id ? newRec : r))
        : [newRec, ...d.records];
      return { ...d, jobs, records };
    });
  }

  /* ---------- UI ---------- */
  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <button className={`${ctaGhost} rounded-full`} onClick={() => router.push("/pro/contractor")}>← Back to Pro</button>
          <div className="text-right">
            <p className={`text-xs ${textMeta}`}>{db.pro.business}</p>
            <p className={`text-xs ${textMeta}`}>Category • {db.pro.category}</p>
          </div>
        </header>

        {/* Summary */}
        <section className={glass}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h1 className={`text-xl font-semibold ${heading}`}>{job ? job.title : rec!.title}</h1>
              <p className={`text-sm ${textMeta}`}>
                {job ? job.clientAddress : rec!.address} •{" "}
                {job
                  ? `Due ${new Date(job.due).toLocaleDateString()}`
                  : `Completed ${new Date(rec!.date).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              {job && job.status !== "complete" ? (
                <>
                  <button className={ctaGhost} onClick={() => setEditOpen(true)}>Edit</button>
                  <button className={ctaPrimary} onClick={markComplete}>Mark Complete</button>
                </>
              ) : (
                <a className={ctaPrimary} href="/pro/records">View All Records</a>
              )}
            </div>
          </div>
        </section>

        {/* Details */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-3 lg:col-span-2">
            <Card title="Activity & Notes">
              {(job?.notes?.length ?? 0) === 0 ? (
                <p className={textMeta}>No notes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {job!.notes!.map((n, i) => (
                    <li key={i} className={`${glassTight} rounded-xl p-3`}>
                      <p className="text-white/90">{n}</p>
                    </li>
                  ))}
                </ul>
              )}

              {job && (
                <div className="mt-3 space-y-2">
                  <label className="block">
                    <span className={fieldLabel}>Add a note</span>
                    <Textarea
                      value={note}
                      onChange={(e: any) => setNote(e.target.value)}
                      placeholder="Add a quick note, scope change, or on-site observation…"
                      aria-label="Add note"
                    />
                  </label>
                  <div className="flex justify-end">
                    <button className={ctaPrimary} onClick={addNote}>Add Note</button>
                  </div>
                </div>
              )}
            </Card>

            <Card title="Attachments">
              <p className={textMeta}>Placeholder uploader. Wire to your uploader later.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button className={ctaGhost}>Upload Photo</button>
                <button className={ctaGhost}>Upload PDF</button>
                <button className={ctaGhost}>Upload Invoice</button>
              </div>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-3">
            <Card title="Status">
              <Row label="State">
                <Badge>{job ? prettyStatus(job.status) : "Complete"}</Badge>
              </Row>
              <Row label="Due / Completed">
                <span>{job ? new Date(job.due).toLocaleDateString() : new Date(rec!.date).toLocaleDateString()}</span>
              </Row>
              <Row label="Address">
                <span>{job ? job.clientAddress : rec!.address}</span>
              </Row>
            </Card>

            <Card title="Billing">
              <Row label="Estimate">
                <span>{currency(job?.estAmount ?? rec?.amount)}</span>
              </Row>
              <Row label="Final">
                <span className={textMeta}>— (set when invoiced)</span>
              </Row>
              <div className="pt-2">
                <button className={ctaGhost}>Create Invoice (placeholder)</button>
              </div>
            </Card>
          </div>
        </section>

        {/* Edit modal */}
        {job && (
          <EditJobModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            job={job}
            onSave={(patch) => updateJob(patch)}
          />
        )}
      </div>
    </main>
  );
}

/* ---------- Shared bits (match /pro look) ---------- */

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover md:object-[50%_35%] lg:object-[50%_30%]"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}


function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={glass}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`text-lg font-medium ${heading}`}>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className={`text-xs ${textMeta}`}>{label}</span>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-xs">
      {children}
    </span>
  );
}

function prettyStatus(s: JobStatus) {
  switch (s) {
    case "requested": return "Requested";
    case "scheduled": return "Scheduled";
    case "in_progress": return "In progress";
    case "complete": return "Complete";
  }
}

function currency(n?: number) {
  if (typeof n !== "number") return "—";
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

/* ---------- Edit Modal ---------- */
function EditJobModal({
  open, onClose, job, onSave,
}: { open: boolean; onClose: () => void; job: Job; onSave: (patch: Partial<Job>) => void }) {
  const [title, setTitle] = useState(job.title);
  const [address, setAddress] = useState(job.clientAddress);
  const [due, setDue] = useState(job.due);
  const [amount, setAmount] = useState(job.estAmount ? String(job.estAmount) : "");
  const [status, setStatus] = useState<JobStatus>(job.status);

  useEffect(() => {
    if (open) {
      setTitle(job.title);
      setAddress(job.clientAddress);
      setDue(job.due);
      setAmount(job.estAmount ? String(job.estAmount) : "");
      setStatus(job.status);
    }
  }, [open, job]);

  function submit() {
    onSave({
      title: title.trim() || job.title,
      clientAddress: address.trim() || job.clientAddress,
      due,
      estAmount: amount ? Number(amount) : undefined,
      status,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Job">
      <div className="space-y-3">
        <label className="block">
          <span className={fieldLabel}>Title</span>
          <Input value={title} onChange={e => setTitle((e.target as HTMLInputElement).value)} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Client address</span>
          <Input value={address} onChange={e => setAddress((e.target as HTMLInputElement).value)} />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>Due date</span>
            <Input type="date" value={due} onChange={e => setDue((e.target as HTMLInputElement).value)} />
          </label>
          <label className="block">
            <span className={fieldLabel}>Estimated amount</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Optional"
              value={amount}
              onChange={e => setAmount((e.target as HTMLInputElement).value)}
            />
          </label>
        </div>
        <label className="block">
          <span className={fieldLabel}>Status</span>
          <select
            className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm outline-none backdrop-blur placeholder:text-white/60 focus:ring-2 focus:ring-white/30"
            value={status}
            onChange={(e) => setStatus(e.target.value as JobStatus)}
          >
            <option value="requested">Requested</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="complete">Complete</option>
          </select>
        </label>

        <div className="mt-2 flex flex-wrap items-center justify-end gap-2">
          <GhostButton className="w-full sm:w-auto" onClick={onClose}>Cancel</GhostButton>
          <Button className="w-full sm:w-auto" onClick={submit}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
