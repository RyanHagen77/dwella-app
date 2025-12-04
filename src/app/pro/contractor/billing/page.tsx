// app/billing/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { glass, glassTight, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, fieldLabel } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { loadJSON, saveJSON } from "@/lib/storage";

/* ---------------- Types ---------------- */
type ServiceStatus = "requested" | "scheduled" | "in_progress" | "complete";
type Service = { id: string; title: string; clientAddress: string; due: string; status: ServiceStatus; estAmount?: number; };
type RecordItem = { id: string; title: string; date: string; address: string; amount?: number };
type Pro = { id: string; business: string; category: string; rating: number; verified: boolean; logo?: string; };
type ProData = { pro: Pro; services: Service[]; records: RecordItem[]; clients: { id: string; address: string; sharedLink: string; owner?: string }[]; reviews: any[] };

type InvoiceStatus = "draft" | "sent" | "paid" | "void";
type Invoice = {
  id: string;
  serviceId?: string;               // link to a service/record if available
  title: string;
  clientAddress: string;
  issueDate: string;            // ISO yyyy-mm-dd
  dueDate: string;              // ISO
  amount: number;               // subtotal (for demo, no tax lines)
  status: InvoiceStatus;
  balance: number;              // amount - payments
};

type Payment = {
  id: string;
  invoiceId: string;
  date: string;                 // ISO
  amount: number;
  method: "card" | "ach" | "cash" | "check" | "other";
};

/* ---------------- Storage keys ---------------- */
const KEY_BILLING = "homefax:billing";
type BillingDB = { invoices: Invoice[]; payments: Payment[] };
const defaultBilling: BillingDB = { invoices: [], payments: [] };

/* ---------------- Page ---------------- */
export default function BillingPage() {
  const [pro, setPro] = useState<Pro | null>(null);
  const [db, setDb] = useState<BillingDB>(defaultBilling);
  const [loading, setLoading] = useState(true);

  // UI state
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "outstanding" | "paid" | "drafts">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [payOpen, setPayOpen] = useState<null | { invoice: Invoice }>(null);
  const [methodsOpen, setMethodsOpen] = useState(false);

  // Load pro data and billing data; seed billing from records if empty
  useEffect(() => {
    const proData = loadJSON<ProData | null>("proData", null);
    setPro(proData?.pro ?? null);

    const billing = loadJSON<BillingDB | null>(KEY_BILLING, null);
    let init = billing ?? defaultBilling;

    // Seed invoices from completed records (demo)
    if ((!billing || billing.invoices.length === 0) && proData?.records?.length) {
      const seeded: Invoice[] = proData.records.slice(0, 3).map(r => ({
        id: "inv-" + cryptoId(),
        serviceId: r.id.startsWith("rec-") ? r.id.slice(4) : undefined,
        title: r.title || "Service",
        clientAddress: r.address,
        issueDate: r.date,
        dueDate: addDaysFrom(r.date, 14),
        amount: r.amount ?? 0,
        status: "sent",
        balance: r.amount ?? 0,
      }));
      init = { invoices: seeded, payments: [] };
      saveJSON(KEY_BILLING, init);
    }

    setDb(init);
    setLoading(false);
  }, []);

  // Persist billing changes
  useEffect(() => { if (!loading) saveJSON(KEY_BILLING, db); }, [db, loading]);

  // Derive payments per invoice
  const paymentsByInvoice = useMemo(() => groupBy(db.payments, p => p.invoiceId), [db.payments]);

  // Recompute balances (keeps things consistent after edits)
  useEffect(() => {
    setDb(prev => ({
      ...prev,
      invoices: prev.invoices.map(inv => {
        const paid = sum(paymentsByInvoice.get(inv.id) ?? [], p => p.amount);
        const balance = clamp(inv.amount - paid, 0, Number.MAX_SAFE_INTEGER);
        const status: InvoiceStatus = balance === 0 && inv.amount > 0 ? "paid" : inv.status === "void" ? "void" : inv.status;
        return { ...inv, balance, status };
      }),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentsByInvoice.size]);

  // Filters/search
  const filtered = useMemo(() => {
    let list = db.invoices;
    if (filter === "outstanding") list = list.filter(i => i.status !== "paid" && i.status !== "void" && i.balance > 0);
    if (filter === "paid") list = list.filter(i => i.status === "paid");
    if (filter === "drafts") list = list.filter(i => i.status === "draft");
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(i =>
        i.title.toLowerCase().includes(t) ||
        i.clientAddress.toLowerCase().includes(t) ||
        (i.id.toLowerCase().includes(t))
      );
    }
    // sort: outstanding first, then newest issue date
    return [...list].sort((a, b) => {
      const aOut = a.status !== "paid" && a.status !== "void" ? 0 : 1;
      const bOut = b.status !== "paid" && b.status !== "void" ? 0 : 1;
      if (aOut !== bOut) return aOut - bOut;
      return (b.issueDate || "").localeCompare(a.issueDate || "");
    });
  }, [db.invoices, q, filter]);

  // KPIs
  const totals = useMemo(() => {
    const gross = sum(db.invoices, i => i.amount);
    const received = sum(db.payments, p => p.amount);
    const outstanding = sum(db.invoices.filter(i => i.status !== "void"), i => i.balance);
    return { gross, received, outstanding };
  }, [db]);

  if (loading) {
    return (
      <main className="relative min-h-screen text-white">

        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="h-9 w-48 animate-pulse rounded-xl bg-white/10 backdrop-blur-sm" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white">

      <div className="mx-auto max-w-7xl p-6 space-y-6">

        {/* KPI cards */}
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Gross Invoiced" value={currency(totals.gross)} />
          <StatCard label="Received" value={currency(totals.received)} />
          <StatCard label="Outstanding" value={currency(totals.outstanding)} />
        </section>

        {/* Controls */}
        <section className={glass}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
              <Chip active={filter === "outstanding"} onClick={() => setFilter("outstanding")}>Outstanding</Chip>
              <Chip active={filter === "paid"} onClick={() => setFilter("paid")}>Paid</Chip>
              <Chip active={filter === "drafts"} onClick={() => setFilter("drafts")}>Drafts</Chip>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <Input className="w-full sm:w-72" placeholder="Search invoices…" value={q} onChange={e => setQ((e.target as HTMLInputElement).value)} />
              <button className={ctaGhost} onClick={() => exportCSV(db)}>Export CSV</button>
            </div>
          </div>
        </section>

        {/* Invoices list */}
        <section className={glass}>
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-white/80">
              <p className="mb-2">No invoices match your filter.</p>
              <button className={ctaGhost} onClick={() => { setQ(""); setFilter("all"); }}>Clear filters</button>
            </div>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((inv) => (
                <li key={inv.id} className="-mx-3">
                  <div className="group rounded-xl px-3 py-3 transition-colors duration-150 hover:bg-white/5">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium text-white group-hover:opacity-95">
                          {inv.title} <span className={`ml-2 rounded-full border px-2 py-0.5 text-xs ${pill(inv.status)}`}>{inv.status}</span>
                        </p>
                        <p className={`truncate text-sm ${textMeta}`}>
                          {inv.clientAddress} • Issued {fmt(inv.issueDate)} • Due {fmt(inv.dueDate)} {inv.serviceId ? (
                            <> • <Link className="underline" href={`/pro/record/${inv.serviceId}`}>View Record</Link></>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded px-2 py-1 text-xs border border-white/20 bg-white/10 text-white/85">
                          Total {currency(inv.amount)}
                        </span>
                        <span className="rounded px-2 py-1 text-xs border border-white/20 bg-white/10 text-white/85">
                          Balance {currency(inv.balance)}
                        </span>
                        {inv.status !== "paid" && inv.status !== "void" && inv.balance > 0 && (
                          <button className={ctaPrimary} onClick={() => setPayOpen({ invoice: inv })}>Record Payment</button>
                        )}
                        {inv.status !== "void" && (
                          <button className={ctaGhost} onClick={() => voidInvoice(inv.id, setDb)}>Void</button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Modals */}
        <NewInvoiceModal
          open={newOpen}
          onClose={() => setNewOpen(false)}
          onCreate={(inv) => setDb(d => ({ ...d, invoices: [inv, ...d.invoices] }))}
        />

        {payOpen && (
          <RecordPaymentModal
            invoice={payOpen.invoice}
            onClose={() => setPayOpen(null)}
            onCreate={(pmt) => setDb(d => ({ ...d, payments: [pmt, ...d.payments] }))}
          />
        )}

        <PaymentMethodsModal open={methodsOpen} onClose={() => setMethodsOpen(false)} />
      </div>
    </main>
  );
}

/* ---------------- Components & helpers ---------------- */

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <section className={`${glass} rounded-2xl p-4`}>
      <p className={`text-xs ${textMeta}`}>{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </section>
  );
}
function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${active ? "border-white/40 bg-white/15" : "border-white/20 bg-white/5 hover:bg-white/10"}`}
    >{children}</button>
  );
}
function pill(status: InvoiceStatus) {
  switch (status) {
    case "paid": return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
    case "sent": return "border-sky-400/40 bg-sky-500/10 text-sky-100";
    case "draft": return "border-white/30 bg-white/10 text-white/85";
    case "void": return "border-rose-400/40 bg-rose-500/10 text-rose-100";
  }
}
function fmt(iso?: string) { return iso ? new Date(iso).toLocaleDateString() : "—"; }
function currency(n?: number) { return typeof n === "number" ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—"; }
function sum<T>(arr: T[], f: (x: T) => number) { return arr.reduce((a, b) => a + f(b), 0); }
function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }
function groupBy<T, K>(arr: T[], key: (x: T) => K) {
  const m = new Map<K, T[]>(); for (const it of arr) { const k = key(it); m.set(k, [...(m.get(k) ?? []), it]); } return m;
}
function cryptoId() { return (globalThis.crypto && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now()); }
function todayISO() { return new Date().toISOString().slice(0, 10); }
function addDaysFrom(iso: string, n: number) { const d = new Date(iso); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

/* ---------------- Mutations ---------------- */
function voidInvoice(id: string, setDb: React.Dispatch<React.SetStateAction<BillingDB>>) {
  setDb(d => ({ ...d, invoices: d.invoices.map(i => (i.id === id ? { ...i, status: "void", balance: 0 } : i)) }));
}
function exportCSV(db: BillingDB) {
  const headers = ["id","title","clientAddress","issueDate","dueDate","amount","status","balance"];
  const rows = db.invoices.map(i => [i.id, i.title, i.clientAddress, i.issueDate, i.dueDate, i.amount, i.status, i.balance]);
  const csv = [headers, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = "invoices.csv"; a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- Modals ---------------- */
function NewInvoiceModal({
  open, onClose, onCreate,
}: {
  open: boolean; onClose: () => void; onCreate: (inv: Invoice) => void;
}) {
  const [form, setForm] = useState<{ title: string; address: string; issue: string; due: string; amount: string }>({
    title: "", address: "", issue: todayISO(), due: addDaysFrom(todayISO(), 14), amount: "",
  });
  function submit() {
    if (!form.title.trim() || !form.address.trim() || !form.amount) return;
    const inv: Invoice = {
      id: "inv-" + cryptoId(),
      title: form.title.trim(),
      clientAddress: form.address.trim(),
      issueDate: form.issue,
      dueDate: form.due,
      amount: Number(form.amount),
      balance: Number(form.amount),
      status: "draft",
    };
    onCreate(inv);
    onClose();
  }
  return (
    <Modal open={open} onCloseAction={onClose} title="New Invoice">
      <div className="space-y-3">
        <label className="block"><span className={fieldLabel}>Title</span>
          <Input value={form.title} onChange={e => setForm({ ...form, title: (e.target as HTMLInputElement).value })} placeholder="e.g., HVAC Tune-Up" />
        </label>
        <label className="block"><span className={fieldLabel}>Client address</span>
          <Input value={form.address} onChange={e => setForm({ ...form, address: (e.target as HTMLInputElement).value })} placeholder="123 Main St" />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block"><span className={fieldLabel}>Issue date</span>
            <Input type="date" value={form.issue} onChange={e => setForm({ ...form, issue: (e.target as HTMLInputElement).value })} />
          </label>
          <label className="block"><span className={fieldLabel}>Due date</span>
            <Input type="date" value={form.due} onChange={e => setForm({ ...form, due: (e.target as HTMLInputElement).value })} />
          </label>
        </div>
        <label className="block"><span className={fieldLabel}>Amount</span>
          <Input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: (e.target as HTMLInputElement).value })} placeholder="0.00" />
        </label>
        <div className="mt-1 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button onClick={submit}>Create</Button>
        </div>
      </div>
    </Modal>
  );
}

function RecordPaymentModal({
  invoice, onClose, onCreate,
}: {
  invoice: Invoice; onClose: () => void; onCreate: (p: Payment) => void;
}) {
  const [form, setForm] = useState<{ amount: string; date: string; method: Payment["method"] }>({
    amount: String(invoice.balance || 0),
    date: todayISO(),
    method: "card",
  });
  function submit() {
    const amount = Number(form.amount);
    if (!amount || amount <= 0) return;
    const pmt: Payment = {
      id: "pmt-" + cryptoId(),
      invoiceId: invoice.id,
      date: form.date,
      amount,
      method: form.method,
    };
    onCreate(pmt);
    onClose();
  }
  return (
    <Modal open onCloseAction={onClose} title={`Record Payment — ${invoice.title}`}>
      <div className="space-y-3">
        <div className={`${glassTight} rounded-xl p-3`}>
          <p className="text-sm">Balance: <strong>{currency(invoice.balance)}</strong></p>
          <p className={`text-xs ${textMeta}`}>Total: {currency(invoice.amount)}</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block"><span className={fieldLabel}>Amount</span>
            <Input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm({ ...form, amount: (e.target as HTMLInputElement).value })} />
          </label>
          <label className="block"><span className={fieldLabel}>Date</span>
            <Input type="date" value={form.date} onChange={e => setForm({ ...form, date: (e.target as HTMLInputElement).value })} />
          </label>
        </div>
        <label className="block"><span className={fieldLabel}>Method</span>
          <select
            className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm outline-none backdrop-blur placeholder:text-white/60 focus:ring-2 focus:ring-white/30"
            value={form.method}
            onChange={e => setForm({ ...form, method: e.target.value as Payment["method"] })}
          >
            <option value="card">Card (demo)</option>
            <option value="ach">ACH (demo)</option>
            <option value="cash">Cash</option>
            <option value="check">Check</option>
            <option value="other">Other</option>
          </select>
        </label>
        <div className="mt-1 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button onClick={submit}>Save Payment</Button>
        </div>
      </div>
    </Modal>
  );
}

function PaymentMethodsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [enabledCard, setEnabledCard] = useState(true);
  const [enabledACH, setEnabledACH] = useState(false);
  const refCard = useRef<HTMLInputElement>(null);

  return (
    <Modal open={open} onCloseAction={onClose} title="Payment Methods (Demo)">
      <div className="space-y-3">
        <p className={textMeta}>For the demo, toggle which methods you “support”. In production, wire to Stripe (test mode).</p>
        <div className={`${glassTight} rounded-xl p-3 space-y-2`}>
          <label className="flex items-center gap-3">
            <input ref={refCard} type="checkbox" checked={enabledCard} onChange={e => setEnabledCard(e.currentTarget.checked)} />
            <span>Accept credit/debit cards</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={enabledACH} onChange={e => setEnabledACH(e.currentTarget.checked)} />
            <span>Accept ACH bank transfers</span>
          </label>
        </div>
        <div className="mt-1 flex justify-end gap-2">
          <GhostButton onClick={onClose}>Close</GhostButton>
          <Button onClick={onClose}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
