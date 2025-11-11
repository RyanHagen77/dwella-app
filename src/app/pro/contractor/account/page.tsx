"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";
import { glass, glassTight, heading, textMeta, ctaPrimary, ctaGhost } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { loadJSON, saveJSON } from "@/lib/storage";

/* ---------------- Types ---------------- */
type Pro = { 
  id: string; 
  business: string; 
  category: string; 
  rating: number; 
  verified: boolean; 
  logo?: string 
};

type Job = {
  id: string;
  title: string;
  clientAddress: string;
  due: string;
  status: "requested" | "scheduled" | "in_progress" | "complete";
  estAmount?: number;
};

type RecordItem = {
  id: string;
  title: string;
  date: string;
  address: string;
  amount?: number;
};

type ClientHome = {
  id: string;
  address: string;
  sharedLink: string;
  owner?: string;
};

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

type ProData = {
  pro: Pro;
  jobs: Job[];
  records: RecordItem[];
  clients: ClientHome[];
  reviews: Review[];
};

type AccountSettings = {
  businessPhone?: string;
  businessEmail?: string;
  website?: string;
  serviceArea?: string;
  logoUrl?: string;
  notifyNewRequests: boolean;
  notifyJobUpdates: boolean;
  notifyReviews: boolean;
  notifyPayouts: boolean;
  twoFactor: boolean;
  lastPasswordChange?: string;
  plan: "Free" | "Pro" | "Team";
  renewalDate?: string;
  team: { id: string; name: string; role: "Owner" | "Technician" | "Admin"; email: string }[];
};

const ACCOUNT_KEY = "homefax:pro:account";

/* ---------------- Page ---------------- */
export default function ContractorAccountPage() {
  const [proDb, setProDb] = useState<ProData | null>(null);
  const [acct, setAcct] = useState<AccountSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const [editBizOpen, setEditBizOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [brandingOpen, setBrandingOpen] = useState(false);

  useEffect(() => {
    const pro = loadJSON<ProData | null>("proData", null);
    setProDb(pro);

    let settings = loadJSON<AccountSettings | null>(ACCOUNT_KEY, null);
    if (!settings) {
      settings = seedDefaultSettings(pro?.pro);
      saveJSON(ACCOUNT_KEY, settings);
    }
    setAcct(settings);
    setLoading(false);
  }, []);

  useEffect(() => { 
    if (acct && !loading) saveJSON(ACCOUNT_KEY, acct); 
  }, [acct, loading]);

  if (loading || !acct) {
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

  const pro = proDb?.pro;
  const planCopy = planDescription(acct.plan);

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Business summary card */}
        <section className={glass}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-white/10 overflow-hidden">
              {acct.logoUrl ? (
                <img src={acct.logoUrl} alt={`${pro?.business ?? "Business"} logo`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg">🏷️</span>
              )}
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${heading}`}>{pro?.business ?? "Your Business"}</h2>
              <p className={`text-sm ${textMeta}`}>
                {pro?.category ?? "contractor"} • {pro?.verified ? "Verified" : "Unverified"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <button className={ctaGhost} onClick={() => setBrandingOpen(true)}>Branding</button>
              <button className={ctaPrimary} onClick={() => setEditBizOpen(true)}>Edit Business</button>
            </div>
          </div>
        </section>

        {/* Grid: left content / right account actions */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="space-y-3 lg:col-span-2">
            {/* Contact + Service Area */}
            <Card title="Contact & Service Area">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Business email">{acct.businessEmail ?? "—"}</Field>
                <Field label="Business phone">{acct.businessPhone ?? "—"}</Field>
                <Field label="Website">
                  {acct.website ? <a className="underline" href={ensureHttp(acct.website)} target="_blank" rel="noreferrer">{acct.website}</a> : "—"}
                </Field>
                <Field label="Service area">{acct.serviceArea ?? "—"}</Field>
              </div>
              <div className="mt-3 flex justify-end">
                <button className={ctaGhost} onClick={() => setEditBizOpen(true)}>Edit</button>
              </div>
            </Card>

            {/* Notifications */}
            <Card title="Notifications">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Toggle
                  label="New job requests"
                  checked={acct.notifyNewRequests}
                  onChange={(v) => setAcct(a => a ? { ...a, notifyNewRequests: v } : a)}
                />
                <Toggle
                  label="Job updates & reminders"
                  checked={acct.notifyJobUpdates}
                  onChange={(v) => setAcct(a => a ? { ...a, notifyJobUpdates: v } : a)}
                />
                <Toggle
                  label="New reviews"
                  checked={acct.notifyReviews}
                  onChange={(v) => setAcct(a => a ? { ...a, notifyReviews: v } : a)}
                />
                <Toggle
                  label="Payouts & invoices"
                  checked={acct.notifyPayouts}
                  onChange={(v) => setAcct(a => a ? { ...a, notifyPayouts: v } : a)}
                />
              </div>
            </Card>

            {/* Security */}
            <Card title="Security">
              <div className="grid grid-cols-1 gap-3">
                <Row label="Password">
                  <span className={textMeta}>Last changed {fmt(acct.lastPasswordChange) || "—"}</span>
                  <div className="flex gap-2">
                    <button className={ctaGhost} onClick={() => setSecurityOpen(true)}>Change password</button>
                  </div>
                </Row>
                <Row label="Two-factor authentication">
                  <Badge active={acct.twoFactor}>{acct.twoFactor ? "Enabled" : "Disabled"}</Badge>
                  <div className="flex gap-2">
                    <button
                      className={ctaGhost}
                      onClick={() => setAcct(a => a ? { ...a, twoFactor: !a.twoFactor } : a)}
                    >
                      {acct.twoFactor ? "Disable 2FA (demo)" : "Enable 2FA (demo)"}
                    </button>
                  </div>
                </Row>
              </div>
            </Card>
          </div>

          {/* Right */}
          <div className="space-y-3">
            {/* Subscription */}
            <Card title="Subscription">
              <div className={`${glassTight} rounded-xl p-3`}>
                <p className="font-medium">{acct.plan} plan</p>
                <p className={`text-sm ${textMeta}`}>{planCopy}</p>
                <p className={`mt-1 text-xs ${textMeta}`}>Renews {fmt(acct.renewalDate) || "—"}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <button className={ctaGhost} onClick={() => setPlanOpen(true)}>Change plan</button>
                <Link className={ctaGhost} href="/billing">View billing</Link>
              </div>
            </Card>

            {/* Team */}
            <Card title="Team">
              {acct.team.length === 0 ? (
                <p className={textMeta}>No team members yet.</p>
              ) : (
                <ul className="space-y-2">
                  {acct.team.map(m => (
                    <li key={m.id} className={`${glassTight} rounded-xl p-3`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white">{m.name}</p>
                          <p className={`text-sm ${textMeta}`}>{m.role} • {m.email}</p>
                        </div>
                        <button
                          className={ctaGhost}
                          onClick={() => setAcct(a => a ? { ...a, team: a.team.filter(t => t.id !== m.id) } : a)}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3">
                <button className={ctaPrimary} onClick={() => setAddTeamOpen(true)}>Invite member</button>
              </div>
            </Card>

            {/* Danger zone */}
            <Card title="Danger Zone">
              <div className={`${glassTight} rounded-xl p-3`}>
                <p className={`text-sm ${textMeta}`}>Delete this contractor account and all associated local demo data.</p>
                <button
                  className="mt-2 rounded-md border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-sm text-rose-100 hover:bg-rose-500/15"
                  onClick={() => {
                    localStorage.removeItem("proData");
                    localStorage.removeItem(ACCOUNT_KEY);
                    window.location.href = "/pro";
                  }}
                >
                  Delete Account (demo)
                </button>
              </div>
            </Card>
          </div>
        </section>

        {/* Modals */}
        {pro && (
          <EditBusinessModal
            open={editBizOpen}
            onCloseAction={() => setEditBizOpen(false)}
            pro={pro}
            acct={acct}
            onSave={(patchPro, patchAcct) => {
              setProDb(d => (d ? { ...d, pro: { ...d.pro, ...patchPro } } : d));
              setAcct(a => (a ? { ...a, ...patchAcct } : a));
              setTimeout(() => { if (proDb) saveJSON("proData", { ...proDb, pro: { ...proDb.pro, ...patchPro } }); }, 0);
            }}
          />
        )}

        <BrandingModal
          open={brandingOpen}
          onCloseAction={() => setBrandingOpen(false)}
          logoUrl={acct.logoUrl}
          onSave={(logoUrl) => setAcct(a => (a ? { ...a, logoUrl } : a))}
        />

        <ChangePasswordModal
          open={securityOpen}
          onCloseAction={() => setSecurityOpen(false)}
          onSaved={(when) => setAcct(a => (a ? { ...a, lastPasswordChange: when } : a))}
        />

        <ChangePlanModal
          open={planOpen}
          current={acct.plan}
          onCloseAction={() => setPlanOpen(false)}
          onSave={(plan) => setAcct(a => (a ? { ...a, plan, renewalDate: addDays(30) } : a))}
        />

        <InviteTeamModal
          open={addTeamOpen}
          onCloseAction={() => setAddTeamOpen(false)}
          onInvite={(m) => setAcct(a => (a ? { ...a, team: [m, ...a.team] } : a))}
        />

        <div className="h-10" />
      </div>
    </main>
  );
}

/* ---------------- Components ---------------- */
function Toggle({ label, checked, onChange }: { label: string; checked?: boolean; onChange?: (val: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
      <span className="text-sm text-white/90">{label}</span>
      <input
        type="checkbox"
        className="h-4 w-4 cursor-pointer accent-white"
        checked={!!checked}
        onChange={(e) => onChange?.(e.currentTarget.checked)}
      />
    </label>
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
        className="object-cover md:object-[50%_35%] lg:object-[50%_30%]"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6))]" />
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <div className={`text-xs ${textMeta}`}>{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
      <span className={`text-xs ${textMeta}`}>{label}</span>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function Badge({ active, children }: { active?: boolean; children: React.ReactNode }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${active ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-100" : "border-white/20 bg-white/10 text-white/80"}`}>
      {children}
    </span>
  );
}

/* ---------------- Modals ---------------- */
function EditBusinessModal({
  open, onCloseAction, pro, acct, onSave,
}: {
  open: boolean;
  onCloseAction: () => void;
  pro: Pro;
  acct: AccountSettings;
  onSave: (proPatch: Partial<Pro>, acctPatch: Partial<AccountSettings>) => void;
}) {
  const [business, setBusiness] = useState(pro.business);
  const [category, setCategory] = useState(pro.category);
  const [email, setEmail] = useState(acct.businessEmail ?? "");
  const [phone, setPhone] = useState(acct.businessPhone ?? "");
  const [website, setWebsite] = useState(acct.website ?? "");
  const [serviceArea, setServiceArea] = useState(acct.serviceArea ?? "");

  useEffect(() => {
    if (open) {
      setBusiness(pro.business);
      setCategory(pro.category);
      setEmail(acct.businessEmail ?? "");
      setPhone(acct.businessPhone ?? "");
      setWebsite(acct.website ?? "");
      setServiceArea(acct.serviceArea ?? "");
    }
  }, [open, pro, acct]);

  function submit() {
    onSave(
      { business: business.trim() || pro.business, category: category.trim() || pro.category },
      {
        businessEmail: email.trim() || undefined,
        businessPhone: phone.trim() || undefined,
        website: website.trim() || undefined,
        serviceArea: serviceArea.trim() || undefined,
      }
    );
    onCloseAction();
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Edit Business Profile">
      <div className="space-y-3">
        <label className="block"><span className={fieldLabel}>Business name</span><Input value={business} onChange={e => setBusiness(e.target.value)} /></label>
        <label className="block"><span className={fieldLabel}>Category</span><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g., HVAC, Plumber" /></label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block"><span className={fieldLabel}>Business email</span><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
          <label className="block"><span className={fieldLabel}>Business phone</span><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 555-5555" /></label>
        </div>
        <label className="block"><span className={fieldLabel}>Website</span><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" /></label>
        <label className="block"><span className={fieldLabel}>Service area</span><Textarea value={serviceArea} onChange={e => setServiceArea(e.target.value)} placeholder="Neighborhoods/cities you cover" /></label>
        <div className="mt-1 flex justify-end gap-2"><GhostButton onClick={onCloseAction}>Cancel</GhostButton><Button onClick={submit}>Save</Button></div>
      </div>
    </Modal>
  );
}

function BrandingModal({
  open, onCloseAction, logoUrl, onSave,
}: { open: boolean; onCloseAction: () => void; logoUrl?: string; onSave: (url?: string) => void }) {
  const [url, setUrl] = useState(logoUrl ?? "");
  useEffect(() => { if (open) setUrl(logoUrl ?? ""); }, [open, logoUrl]);

  function submit() { onSave(url.trim() || undefined); onCloseAction(); }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Branding">
      <div className="space-y-3">
        <p className={textMeta}>For the demo, paste a logo URL. In production, wire to your uploader.</p>
        <label className="block"><span className={fieldLabel}>Logo URL</span><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://…" /></label>
        <div className="mt-1 flex justify-end gap-2"><GhostButton onClick={onCloseAction}>Cancel</GhostButton><Button onClick={submit}>Save</Button></div>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({
  open, onCloseAction, onSaved,
}: { open: boolean; onCloseAction: () => void; onSaved: (whenISO: string) => void }) {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [conf, setConf] = useState("");

  function submit() {
    if (!next || next !== conf) return;
    onSaved(new Date().toISOString());
    onCloseAction();
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Change Password (Demo)">
      <div className="space-y-3">
        <label className="block"><span className={fieldLabel}>Current password</span><Input type="password" value={cur} onChange={e => setCur(e.target.value)} /></label>
        <label className="block"><span className={fieldLabel}>New password</span><Input type="password" value={next} onChange={e => setNext(e.target.value)} /></label>
        <label className="block"><span className={fieldLabel}>Confirm new password</span><Input type="password" value={conf} onChange={e => setConf(e.target.value)} /></label>
        <div className="mt-1 flex justify-end gap-2"><GhostButton onClick={onCloseAction}>Cancel</GhostButton><Button onClick={submit}>Save</Button></div>
      </div>
    </Modal>
  );
}

function ChangePlanModal({
  open, onCloseAction, current, onSave,
}: {
  open: boolean;
  onCloseAction: () => void;
  current: AccountSettings["plan"];
  onSave: (p: AccountSettings["plan"]) => void;
}) {
  const [plan, setPlan] = useState<AccountSettings["plan"]>(current);

  useEffect(() => { if (open) setPlan(current); }, [open, current]);

  function submit() {
    onSave(plan);
    onCloseAction();
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Change Plan (Demo)">
      <div className="space-y-3">
        <label className="block">
          <span className={fieldLabel}>Plan</span>
          <select
            className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm outline-none backdrop-blur placeholder:text-white/60 focus:ring-2 focus:ring-white/30"
            value={plan}
            onChange={(e) => setPlan(e.target.value as AccountSettings["plan"])}
          >
            <option value="Free">Free</option>
            <option value="Pro">Pro</option>
            <option value="Team">Team</option>
          </select>
        </label>
        <div className="mt-1 flex justify-end gap-2">
          <GhostButton onClick={onCloseAction}>Cancel</GhostButton>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}

function InviteTeamModal({
  open, onCloseAction, onInvite,
}: { open: boolean; onCloseAction: () => void; onInvite: (m: AccountSettings["team"][number]) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"Owner" | "Technician" | "Admin">("Technician");

  function submit() {
    if (!name.trim() || !email.trim()) return;
    onInvite({ id: cryptoId(), name: name.trim(), email: email.trim(), role });
    onCloseAction();
  }

  return (
    <Modal open={open} onCloseAction={onCloseAction} title="Invite Team Member (Demo)">
      <div className="space-y-3">
        <label className="block"><span className={fieldLabel}>Name</span><Input value={name} onChange={e => setName(e.target.value)} /></label>
        <label className="block"><span className={fieldLabel}>Email</span><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block"><span className={fieldLabel}>Role</span>
          <select
            className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm outline-none backdrop-blur focus:ring-2 focus:ring-white/30"
            value={role}
            onChange={(e) => setRole(e.target.value as "Owner" | "Technician" | "Admin")}
          >
            <option value="Technician">Technician</option>
            <option value="Admin">Admin</option>
            <option value="Owner">Owner</option>
          </select>
        </label>
        <div className="mt-1 flex justify-end gap-2"><GhostButton onClick={onCloseAction}>Cancel</GhostButton><Button onClick={submit}>Send Invite</Button></div>
      </div>
    </Modal>
  );
}

/* ---------------- Utils ---------------- */
function seedDefaultSettings(pro?: Pro): AccountSettings {
  return {
    businessPhone: "",
    businessEmail: "",
    website: "",
    serviceArea: "",
    logoUrl: pro?.logo,
    notifyNewRequests: true,
    notifyJobUpdates: true,
    notifyReviews: true,
    notifyPayouts: true,
    twoFactor: false,
    lastPasswordChange: undefined,
    plan: "Pro",
    renewalDate: addDays(30),
    team: [],
  };
}

function ensureHttp(url?: string) {
  if (!url) return "#";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function fmt(iso?: string) { 
  return iso ? new Date(iso).toLocaleDateString() : ""; 
}

function cryptoId() { 
  return (globalThis.crypto && "randomUUID" in crypto) ? crypto.randomUUID() : String(Date.now()); 
}

function addDays(n: number) { 
  const d = new Date(); 
  d.setDate(d.getDate() + n); 
  return d.toISOString().slice(0,10); 
}

function planDescription(plan: AccountSettings["plan"]) {
  switch (plan) {
    case "Free": return "Basics for getting started. Limited work and storage.";
    case "Pro": return "All core features, priority support, and higher limits.";
    case "Team": return "Multi-user with roles, team-wide reporting, and SSO.";
  }
}