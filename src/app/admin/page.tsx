"use client";

import { useEffect, useMemo, useState } from "react";
import AdminTopBar from "./_components/AdminTopBar";
import AdminSidebar from "./_components/AdminSidebar";
import { glass, glassTight, heading, textMeta, ctaGhost, ctaPrimary } from "@/lib/glass";
import { loadJSON, saveJSON } from "@/lib/storage";
import { UserModal } from "../../components/admin/UserModal";

/* ---------- Types ---------- */
export type Role = "superadmin" | "admin" | "support" | "read_only";
export type UserKind = "homeowner" | "realtor" | "contractor" | "inspector" | "admin";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  kind: UserKind;
  role: Role;               // admin staff roles (non-admin users default to read_only)
  status: "active" | "suspended";
  createdAt: string;
  lastActive?: string;
};

type AdminCounts = { users: number; properties: number; vendors: number; requests: number; reports: number; };

function iso(daysOffset = 0) { const d = new Date(); d.setDate(d.getDate() + daysOffset); return d.toISOString(); }

/* ---------- Seed ---------- */
const SEED_USERS: AdminUser[] = [
  { id: "u1", name: "Ava Lane",  email: "ava@hometrace.com",      kind: "admin",      role: "superadmin", status: "active",    createdAt: iso(-90), lastActive: iso(-1) },
  { id: "u2", name: "Ben Carter",email: "benc@brokerage.com",     kind: "realtor",    role: "read_only",  status: "active",    createdAt: iso(-60), lastActive: iso(-2) },
  { id: "u3", name: "ChillRight HVAC", email: "ops@chillright.com", kind: "contractor", role: "read_only", status: "active",    createdAt: iso(-45), lastActive: iso(-3) },
  { id: "u4", name: "Dana Patel",email: "dana@home.com",          kind: "homeowner",  role: "read_only",  status: "active",    createdAt: iso(-30) },
  { id: "u5", name: "Evan Ruiz", email: "evan@inspectsure.com",   kind: "inspector",  role: "read_only",  status: "suspended", createdAt: iso(-25) },
];

/* ---------- Page ---------- */
export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [mounted, setMounted] = useState(false);

  // Filters
  const [q, setQ] = useState("");
  const [role, setRole] = useState<Role | "all">("all");
  const [kind, setKind] = useState<UserKind | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");

  // Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);

  useEffect(() => {
    const cached = loadJSON<AdminUser[] | null>("admin_users", null);
    if (cached?.length) setUsers(cached);
    else { saveJSON("admin_users", SEED_USERS); setUsers(SEED_USERS); }
    setMounted(true);
  }, []);
  useEffect(() => { if (mounted) saveJSON("admin_users", users); }, [mounted, users]);

  const counts: AdminCounts = useMemo(() => ({
    users: users.length,
    properties: 128,                  // demo stub
    vendors: users.filter(u => u.kind === "contractor").length,
    requests: 14 + users.filter(u => u.kind === "realtor").length, // demo stub
    reports: 37,                      // demo stub
  }), [users]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return users.filter(u => {
      const matchesQ = !ql || u.name.toLowerCase().includes(ql) || u.email.toLowerCase().includes(ql);
      const matchesRole = role === "all" ? true : u.role === role;
      const matchesKind = kind === "all" ? true : u.kind === kind;
      const matchesStatus = status === "all" ? true : u.status === status;
      return matchesQ && matchesRole && matchesKind && matchesStatus;
    });
  }, [users, q, role, kind, status]);

  function upsertUser(next: AdminUser) {
    setUsers(prev => {
      const i = prev.findIndex(u => u.id === next.id);
      if (i === -1) return [next, ...prev];
      const copy = prev.slice(); copy[i] = next; return copy;
    });
  }
  function createUser() {
    setEditing({ id: `u${Date.now()}`, name: "", email: "", kind: "homeowner", role: "read_only", status: "active", createdAt: new Date().toISOString() });
    setEditOpen(true);
  }
  function editUser(u: AdminUser) { setEditing(u); setEditOpen(true); }
  function toggleStatus(u: AdminUser) { upsertUser({ ...u, status: u.status === "active" ? "suspended" : "active" }); }

  return (
    <main className="relative min-h-screen text-white">
      {/* Fixed background */}
      <div className="fixed inset-0 -z-50">
        <img src="/myhomedox_home3.webp" alt="" className="h-full w-full object-cover md:object-[50%_35%] lg:object-[50%_30%]" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
      </div>

      <AdminTopBar />

      <div className="mx-auto max-w-7xl px-6 pb-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
          <AdminSidebar />

          {/* Main */}
          <div className="space-y-6 pt-6 lg:pt-8">
            {/* Overview cards */}
            <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <Stat label="Users" value={counts.users} />
              <Stat label="Properties" value={counts.properties} />
              <Stat label="Vendors" value={counts.vendors} />
              <Stat label="Requests" value={counts.requests} />
              <Stat label="Reports" value={counts.reports} />
            </section>

            {/* Users */}
            <section className={glass} aria-labelledby="users-heading">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 id="users-heading" className={`text-lg font-medium ${heading}`}>Users</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <button className={ctaPrimary} onClick={createUser}>New User</button>
                  <a className={ctaGhost} href="/admin/export">Export CSV</a>
                </div>
              </div>

              {/* Filters */}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or email…"
                  className="h-9 w-full max-w-xs rounded-lg border border-white/20 bg-black/30 px-3 text-sm text-white placeholder:text-white/50 focus:ring-2 focus:ring-white/60"
                />
                <Select label="Role"   value={role}   onChange={v => setRole(v as Role | "all")} options={["all","superadmin","admin","support","read_only"]} />
                <Select label="Type"   value={kind}   onChange={v => setKind(v as UserKind | "all")} options={["all","homeowner","realtor","contractor","inspector","admin"]} />
                <Select label="Status" value={status} onChange={v => setStatus(v as any)} options={["all","active","suspended"]} />
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-sm">
                  <thead>
                    <tr className="text-left text-white/80">
                      <th className="border-b border-white/10 py-2 pr-3">Name</th>
                      <th className="border-b border-white/10 py-2 pr-3">Email</th>
                      <th className="border-b border-white/10 py-2 pr-3">Type</th>
                      <th className="border-b border-white/10 py-2 pr-3">Role</th>
                      <th className="border-b border-white/10 py-2 pr-3">Status</th>
                      <th className="border-b border-white/10 py-2 pr-3">Created</th>
                      <th className="border-b border-white/10 py-2 pr-3">Last Active</th>
                      <th className="border-b border-white/10 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={8} className="py-8 text-center text-white/70">No users match your filters.</td></tr>
                    ) : filtered.map(u => (
                      <tr key={u.id} className="hover:bg-white/5">
                        <td className="py-2 pr-3 text-white">{u.name}</td>
                        <td className="py-2 pr-3 text-white/90">{u.email}</td>
                        <td className="py-2 pr-3">{cap(u.kind)}</td>
                        <td className="py-2 pr-3">{cap(u.role)}</td>
                        <td className="py-2 pr-3">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                            u.status === "active"
                              ? "border border-green-400/40 bg-green-500/10 text-green-100"
                              : "border border-red-400/40 bg-red-500/10 text-red-100"
                          }`}>{cap(u.status)}</span>
                        </td>
                        <td className="py-2 pr-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-2 pr-3">{u.lastActive ? new Date(u.lastActive).toLocaleDateString() : "—"}</td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button className={ctaGhost} onClick={() => editUser(u)}>Edit</button>
                            <button className={ctaGhost} onClick={() => toggleStatus(u)}>
                              {u.status === "active" ? "Suspend" : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Stubs (follow Users pattern to implement) */}
            <SectionStub title="Properties" />
            <SectionStub title="Vendors" />
            <SectionStub title="Requests" />
            <SectionStub title="Reports" />
          </div>
        </div>
      </div>

      <UserModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        value={editing}
        onSubmit={(v) => { upsertUser(v); setEditOpen(false); }}
      />
    </main>
  );
}

/* ---------- Bits ---------- */
function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className={glassTight} role="group" aria-label={label}>
      <div className={`text-sm ${textMeta}`}>{label}</div>
      <div className="mt-1 text-xl font-semibold text-white">{value}</div>
    </div>
  );
}
function Select({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="inline-flex items-center gap-2">
      <span className={`text-xs ${textMeta}`}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-white/20 bg-white/10 px-2 text-sm text-white/90 backdrop-blur focus:ring-2 focus:ring-white/40"
      >
        {options.map(o => <option key={o} value={o}>{cap(o)}</option>)}
      </select>
    </label>
  );
}
function SectionStub({ title }: { title: string }) {
  return (
    <section className={glass}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`text-lg font-medium ${heading}`}>{title}</h2>
        <a className={ctaGhost} href="#">{/* wire later */}Open</a>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className={glassTight}>Coming soon</div>
        <div className={glassTight}>Coming soon</div>
      </div>
    </section>
  );
}
function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1).replace("_"," "); }
