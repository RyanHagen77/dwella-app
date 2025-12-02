// app/pro/clients/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { glass, glassTight, textMeta, ctaGhost } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, fieldLabel } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { loadJSON, saveJSON } from "@/lib/storage";

/* ------------ Types (aligned with /pro) ------------ */
type ClientHome = { id: string; address: string; sharedLink: string; owner?: string; };
type ServiceStatus = "requested" | "scheduled" | "in_progress" | "complete";
type Service = { id: string; title: string; clientAddress: string; due: string; status: ServiceStatus; estAmount?: number; };
type RecordItem = { id: string; title: string; date: string; address: string; amount?: number; };
type Review = { id: string; author: string; rating: number; text: string; date: string; };
type Pro = { id: string; business: string; category: string; rating: number; verified: boolean; logo?: string; };
type ProData = { pro: Pro; services: Service[]; records: RecordItem[]; clients: ClientHome[]; reviews: Review[]; };

export default function ClientsPage() {
  const [db, setDb] = useState<ProData | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => { setDb(loadJSON<ProData | null>("proData", null)); setLoading(false); }, []);
  useEffect(() => { if (db) saveJSON("proData", db); }, [db]);

  const clients = db?.clients ?? [];
  const filtered = useMemo(() => {
    if (!q.trim()) return clients;
    const t = q.toLowerCase();
    return clients.filter(c =>
      c.address.toLowerCase().includes(t) || (c.owner ?? "").toLowerCase().includes(t)
    );
  }, [clients, q]);

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

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <div className="mx-auto max-w-7xl p-6 space-y-6">

        {/* Search / actions */}
        <section className={glass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input placeholder="Search address or owner…" value={q} onChange={e => setQ((e.target as HTMLInputElement).value)} />
            <div className="flex gap-2">
              <button className={ctaGhost}>New Request (demo)</button>
              <button className={ctaGhost}>Import CSV (demo)</button>
            </div>
          </div>
        </section>

        {/* List */}
        <section className={glass}>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-white/80">
              <p className="mb-2">No clients match your search.</p>
              <button className={ctaGhost} onClick={() => setQ("")}>Clear</button>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map(c => (
                <li key={c.id} className={`${glassTight} rounded-xl p-3`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">{c.address}</p>
                      <p className={`text-sm ${textMeta}`}>Owner • {c.owner ?? "—"}</p>
                    </div>
                    <a className="underline text-white/85" href={c.sharedLink}>Report</a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link className={ctaGhost} href={`/pro/jobs?q=${encodeURIComponent(c.address)}`}>View jobs</Link>
                    <button className={ctaGhost} onClick={() => createJobFor(c, setDb)}>New job</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Modal */}
        <AddClientModal
          open={addOpen}
          onClose={() => setAddOpen(false)}
          onCreate={(client) => setDb(d => (d ? { ...d, clients: [client, ...(d.clients ?? [])] } : d))}
        />
      </div>
    </main>
  );
}

/* ------------ Local helpers/components ------------ */
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
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6))]" />
    </div>
  );
}
function createJobFor(client: ClientHome, setDb: React.Dispatch<React.SetStateAction<ProData | null>>) {
  const id = cryptoId();
  const due = new Date(); due.setDate(due.getDate() + 3);
  setDb(d => {
    if (!d) return d;
    const job: Service = { id, title: "New Service Request", clientAddress: client.address, due: due.toISOString().slice(0,10), status: "requested" };
    return { ...d, services: [job, ...d.services] };
  });
}
function cryptoId() { return (globalThis.crypto && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now()); }

function AddClientModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (c: ClientHome) => void; }) {
  const [form, setForm] = useState({ address: "", owner: "" });
  function submit() {
    if (!form.address.trim()) return;
    const slug = form.address.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    onCreate({ id: cryptoId(), address: form.address.trim(), owner: form.owner.trim() || undefined, sharedLink: `/report?h=${slug}` });
    onClose();
  }
  return (
    <Modal open={open} onCloseAction={onClose} title="Add Client">
      <div className="space-y-3">
        <label className="block"><span className={fieldLabel}>Address</span><Input value={form.address} onChange={e => setForm({ ...form, address: (e.target as HTMLInputElement).value })} placeholder="123 Main St" /></label>
        <label className="block"><span className={fieldLabel}>Owner (optional)</span><Input value={form.owner} onChange={e => setForm({ ...form, owner: (e.target as HTMLInputElement).value })} placeholder="e.g., Nguyen" /></label>
        <div className="mt-1 flex justify-end gap-2"><GhostButton onClick={onClose}>Cancel</GhostButton><Button onClick={submit}>Add</Button></div>
      </div>
    </Modal>
  );
}
