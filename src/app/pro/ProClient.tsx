// app/pro/ProClient.tsx
"use client";

import { useEffect, useState } from "react";
import {
  glass,
  glassTight,
  heading,
  textMeta,
  ctaPrimary,
  ctaGhost,
} from "@/lib/glass";
import Image from "next/image";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, fieldLabel } from "@/components/ui";
import { loadJSON, saveJSON } from "@/lib/storage";

// ---- Types ----
type Pro = {
  id: string;
  business: string;
  category: string; // e.g., HVAC, Plumber
  rating: number; // 0-5
  verified: boolean;
  logo?: string;
};

type ServiceStatus = "requested" | "scheduled" | "in_progress" | "complete";

type Service = {
  id: string;
  title: string;
  clientAddress: string;
  due: string; // ISO date
  status: ServiceStatus;
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
  rating: number; // 0-5
  text: string;
  date: string;
};

type ProData = {
  pro: Pro;
  services: Service[];
  records: RecordItem[];
  clients: ClientHome[];
  reviews: Review[];
};

// ---- Page ----
export default function ProClient() {
  const [data, setData] = useState<ProData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);

      // Prefer cached payload; fall back to mock
      const cached = loadJSON<ProData | null>("proData", null);
      if (cached) {
        // Ensure category is "contractor" on this page
        setData({
          ...cached,
          pro: { ...cached.pro, category: "contractor" },
        });
        setLoading(false);
        return;
      }

      // Simulate API latency + inline mock fallback
      await new Promise((r) => setTimeout(r, 250));
      const mock: ProData = {
        pro: {
          id: "pro-1",
          business: "ChillRight Heating & Air",
          category: "contractor", // lock it here
          rating: 4.7,
          verified: false,
          logo: "/logo-placeholder.svg",
        },
        services: [
          {
            id: "s1",
            title: "AC Tune-up",
            clientAddress: "1842 Maple St",
            due: new Date().toISOString().slice(0, 10),
            status: "scheduled",
            estAmount: 180,
          },
          {
            id: "s2",
            title: "Heat Pump Install Quote",
            clientAddress: "92 3rd Ave",
            due: addDays(3),
            status: "requested",
          },
          {
            id: "s3",
            title: "Thermostat Replacement",
            clientAddress: "501 Park Ln",
            due: addDays(5),
            status: "in_progress",
            estAmount: 220,
          },
        ],
        records: [
          {
            id: "r1",
            title: "Furnace Repair",
            date: addDays(-14),
            address: "73 Oak Ct",
            amount: 420,
          },
          {
            id: "r2",
            title: "Mini-split Install",
            date: addDays(-32),
            address: "11 Lakeview Dr",
            amount: 3200,
          },
        ],
        clients: [
          {
            id: "h1",
            address: "1842 Maple St",
            sharedLink: "/report?h=1842-maple",
            owner: "Nguyen",
          },
          {
            id: "h2",
            address: "92 3rd Ave",
            sharedLink: "/report?h=92-3rd",
            owner: "Santos",
          },
          {
            id: "h3",
            address: "501 Park Ln",
            sharedLink: "/report?h=501-park",
            owner: "Patel",
          },
        ],
        reviews: [
          {
            id: "rev1",
            author: "K. Santos",
            rating: 5,
            text: "On time, super clear, fair price.",
            date: addDays(-7),
          },
          {
            id: "rev2",
            author: "D. Patel",
            rating: 4,
            text: "Quick thermostat swap, works great.",
            date: addDays(-28),
          },
        ],
      };

      saveJSON("proData", mock);
      setData(mock);
      setLoading(false);
    }
    load();
  }, []);

  // Persist edits
  useEffect(() => {
    if (data) saveJSON("proData", data);
  }, [data]);

  if (loading || !data) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <div className="mx-auto max-w-7xl p-6 space-y-6">
          <div className="h-9 w-48 animate-pulse rounded-xl bg-white/10 backdrop-blur-sm" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="h-64 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm md:col-span-2" />
            <div className="h-64 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
          </div>
        </div>
      </main>
    );
  }

  const { pro, services, records, clients, reviews } = data;

  // Derived
  const activeServices = services.filter((s) => s.status !== "complete");

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Hero / Profile */}
        <section className={glass}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-white/20 bg-white/10">
              <span className="text-lg">🏷️</span>
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${heading}`}>
                {pro.business}
              </h2>
              <p className={`text-sm ${textMeta}`}>
                {pro.category} • {pro.rating.toFixed(1)} ★{" "}
                {pro.verified ? "• Verified" : "• Unverified"}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
              <button
                className={ctaGhost}
                onClick={() => setEditOpen(true)}
              >
                Edit Profile
              </button>
              {!pro.verified ? (
                <button
                  className={ctaPrimary}
                  onClick={() => setVerifyOpen(true)}
                >
                  Get Verified
                </button>
              ) : (
                <a className={ctaPrimary} href="/pro/profile">
                  View Profile
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Active Services + Past Work */}
          <div className="space-y-3 lg:col-span-2">
            <Card
              title="Active Services / Requests"
              action={
                <button
                  className={ctaPrimary}
                  onClick={() => setAddServiceOpen(true)}
                >
                  Add Service
                </button>
              }
            >
              {activeServices.length === 0 ? (
                <Empty
                  message="No active services"
                  actionLabel="Add a service"
                  onAction={() => setAddServiceOpen(true)}
                />
              ) : (
                <ul className="divide-y divide-white/10">
                  {activeServices.map((s) => (
                    <li key={s.id} className="-mx-3">
                      <Link
                        href={`/pro/record/${s.id}`}
                        prefetch={false}
                        className="group block rounded-xl px-3 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 hover:bg-white/5"
                        aria-label={`Open service ${s.title}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-white group-hover:opacity-95">
                              {s.title}
                            </p>
                            <p className={`text-sm ${textMeta}`}>
                              {s.clientAddress} • Due{" "}
                              {new Date(s.due).toLocaleDateString()} •{" "}
                              {prettyStatus(s.status)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {s.estAmount && (
                              <span className="rounded px-2 py-1 text-xs border border-white/20 bg-white/10 text-white/85">
                                ${s.estAmount}
                              </span>
                            )}
                            <button
                              className={ctaGhost}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markComplete(s.id, setData);
                              }}
                            >
                              Mark Complete
                            </button>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Completed Services / Records">
              {records.length === 0 ? (
                <Empty
                  message="No records yet"
                  actionLabel="Add a record"
                  onAction={() => setAddServiceOpen(true)}
                />
              ) : (
                <ul className="divide-y divide-white/10">
                  {records.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-center justify-between gap-3 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{r.title}</p>
                        <p className={`text-sm ${textMeta}`}>
                          {new Date(r.date).toLocaleDateString()} •{" "}
                          {r.address}
                        </p>
                      </div>
                      {r.amount && (
                        <span className="rounded px-2 py-1 text-xs border border-white/20 bg-white/10 text-white/85">
                          ${r.amount}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Right: Clients / Reviews / Verification */}
          <div className="space-y-3">
            <Card
              title="Clients"
              action={
                <a className={ctaGhost} href="/pro/clients">
                  Manage
                </a>
              }
            >
              <ul className="space-y-2">
                {clients.map((c) => (
                  <li
                    key={c.id}
                    className={`${glassTight} flex items-center justify-between`}
                  >
                    <div>
                      <p className="text-white">{c.address}</p>
                      <p className={`text-sm ${textMeta}`}>
                        Owner • {c.owner || "—"}
                      </p>
                    </div>
                    <a
                      className="underline text-white/85"
                      href={c.sharedLink}
                    >
                      Report
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <Card title="Reviews & Ratings">
              {reviews.length === 0 ? (
                <p className={textMeta}>No reviews yet.</p>
              ) : (
                <ul className="space-y-2">
                  {reviews.map((rv) => (
                    <li key={rv.id} className={glassTight}>
                      <div className="flex items-center justify-between">
                        <span className="text-white">{rv.author}</span>
                        <span className={`text-sm ${textMeta}`}>
                          {rv.rating.toFixed(1)} ★ •{" "}
                          {new Date(rv.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white/85 mt-1">{rv.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              title="Verification / Documents"
              action={
                <button
                  className={ctaPrimary}
                  onClick={() => setVerifyOpen(true)}
                >
                  {pro.verified ? "Update Docs" : "Get Verified"}
                </button>
              }
            >
              <p className={`text-sm ${textMeta}`}>
                Upload license, insurance, and W-9 to earn the Verified Pro
                badge.
              </p>
            </Card>
          </div>
        </section>

        {/* Modals */}
        <AddServiceModal
          open={addServiceOpen}
          onClose={() => setAddServiceOpen(false)}
          onCreate={(service) => {
            setData((d) =>
              d ? { ...d, services: [service, ...d.services] } : d
            );
          }}
        />

        <VerifyDocsModal
          open={verifyOpen}
          onClose={() => setVerifyOpen(false)}
          onVerified={() => {
            setData((d) =>
              d ? { ...d, pro: { ...d.pro, verified: true } } : d
            );
          }}
        />

        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          pro={pro}
          onSave={(patch) => {
            setData((d) =>
              d ? { ...d, pro: { ...d.pro, ...patch } } : d
            );
          }}
        />

        <div className="h-12" />
      </div>
    </main>
  );
}

// ---- Reusable bits ----
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

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={glass}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`text-lg font-medium ${heading}`}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Empty({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-8 text-center text-white/70">
      <p className="mb-2">{message}</p>
      {onAction && (
        <button className={ctaGhost} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function prettyStatus(s: ServiceStatus) {
  switch (s) {
    case "requested":
      return "Requested";
    case "scheduled":
      return "Scheduled";
    case "in_progress":
      return "In progress";
    case "complete":
      return "Complete";
  }
}

function markComplete(
  id: string,
  setData: React.Dispatch<React.SetStateAction<ProData | null>>
) {
  setData((d) => {
    if (!d) return d;
    const service = d.services.find((s) => s.id === id);
    if (!service) return d;

    const updatedServices = d.services.map((s) =>
      s.id === id ? { ...s, status: "complete" } : s
    );

    const newRecord: RecordItem = {
      id: `rec-${id}`,
      title: service.title,
      date: new Date().toISOString().slice(0, 10),
      address: service.clientAddress,
      amount: service.estAmount,
    };

    return {
      ...d,
      services: updatedServices,
      records: [newRecord, ...d.records],
    };
  });
}

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ---- Modals ----

function AddServiceModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (service: Service) => void;
}) {
  const [form, setForm] = useState({
    title: "",
    address: "",
    due: new Date().toISOString().slice(0, 10),
    amount: "",
  });

  function submit() {
    if (!form.title.trim() || !form.address.trim()) return;
    onCreate({
      id: cryptoId(),
      title: form.title.trim(),
      clientAddress: form.address.trim(),
      due: form.due,
      status: "requested",
      estAmount: form.amount ? Number(form.amount) : undefined,
    });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Service / Request">
      <div className="space-y-3">
        <label className="block">
          <span className={fieldLabel}>Title</span>
          <Input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g., AC Tune-up"
          />
        </label>
        <label className="block">
          <span className={fieldLabel}>Client address</span>
          <Input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="123 Main St"
          />
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className={fieldLabel}>Due date</span>
            <Input
              type="date"
              value={form.due}
              onChange={(e) => setForm({ ...form, due: e.target.value })}
            />
          </label>
          <label className="block">
            <span className={fieldLabel}>Estimated amount</span>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="Optional"
              value={form.amount}
              onChange={(e) =>
                setForm({ ...form, amount: e.target.value })
              }
            />
          </label>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
          <GhostButton className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </GhostButton>
          <Button className="w-full sm:w-auto" onClick={submit}>
            Add
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function VerifyDocsModal({
  open,
  onClose,
  onVerified,
}: {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Get Verified">
      <div className="space-y-3">
        <p className={`text-sm ${textMeta}`}>
          Upload your license, insurance, and W-9. We’ll review and notify you.
        </p>
        <div className={glassTight}>
          <p className="text-white/85 text-sm">
            Upload placeholders (wire actual uploader later):
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button className={ctaGhost}>Upload License</button>
            <button className={ctaGhost}>Upload Insurance</button>
            <button className={ctaGhost}>Upload W-9</button>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
          <GhostButton className="w-full sm:w-auto" onClick={onClose}>
            Close
          </GhostButton>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              onVerified();
              onClose();
            }}
          >
            Submit for Review
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditProfileModal({
  open,
  onClose,
  pro,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  pro: Pro;
  onSave: (patch: Partial<Pro>) => void;
}) {
  const [name, setName] = useState(pro.business);
  const [category, setCategory] = useState(pro.category);

  useEffect(() => {
    if (open) {
      setName(pro.business);
      setCategory(pro.category);
    }
  }, [open, pro]);

  function submit() {
    if (!name.trim()) return;
    onSave({ business: name.trim(), category: category.trim() });
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile">
      <div className="space-y-3">
        <label className="block">
          <span className={fieldLabel}>Business name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block">
          <span className={fieldLabel}>Category</span>
          <Input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., HVAC, Plumber"
          />
        </label>
        <div className="mt-1 flex flex-wrap items-center justify-end gap-2">
          <GhostButton className="w-full sm:w-auto" onClick={onClose}>
            Cancel
          </GhostButton>
          <Button className="w-full sm:w-auto" onClick={submit}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function cryptoId() {
  return globalThis.crypto && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now());
}