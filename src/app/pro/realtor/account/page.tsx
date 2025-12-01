"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import RealtorTopBar from "../../_components/RealtorTopBar";
import { useRealtorData } from "@/lib/realtorData";
import { glass, glassTight, heading, textMeta, ctaGhost } from "@/lib/glass";
import { Button, GhostButton } from "@/components/ui/Button";
import { Input, Textarea, fieldLabel } from "@/components/ui";

/* ---------- Background ---------- */
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

/* ---------- Page ---------- */
export default function RealtorAccountPage() {
  const { data, setData, loading } = useRealtorData();

  // local form state (mirrors data.pro)
  const [agentName, setAgentName] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [logo, setLogo] = useState("");
  const [bio, setBio] = useState("");
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifRequests, setNotifRequests] = useState(true);

  useEffect(() => {
    if (!data) return;
    setAgentName(data.pro.agentName);
    setBrokerage(data.pro.brokerage);
    setLogo(data.pro.logo ?? "");
    // demo extra fields
    setBio(
      "Experienced listing agent focused on disclosure-ready stats and smooth closings. Ask me about Homefax."
    );
    setNotifEmail(true);
    setNotifRequests(true);
  }, [data]);

  function saveProfile() {
    if (!data) return;
    setData((prev) => ({
      ...prev,
      pro: {
        ...prev.pro,
        agentName: agentName.trim() || prev.pro.agentName,
        brokerage: brokerage.trim() || prev.pro.brokerage,
        logo: logo.trim() || undefined,
      },
    }));
  }

  function clearDemoData() {
    if (!data) return;
    localStorage.removeItem("realtorData");
    location.assign("/realtor"); // reloads & reseeds via ensureRealtorData
  }

  if (loading || !data) {
    return (
      <main className="relative min-h-screen text-white">
        <Bg />
        <RealtorTopBar />
        <div className="mx-auto max-w-7xl p-6">
          <div className="h-32 animate-pulse rounded-2xl bg-white/10 backdrop-blur-sm" />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white">
      <Bg />
      <RealtorTopBar />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Title */}
        <header>
          <h1 className={`text-2xl font-semibold ${heading}`}>Account — Realtor</h1>
          <p className={`mt-1 text-sm ${textMeta}`}>
            Manage profile, notifications, and connected services.
          </p>
        </header>

        {/* GRID */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="space-y-3 lg:col-span-2">
            {/* Profile */}
            <section className={glass} aria-labelledby="profile-heading">
              <div className="mb-2 flex items-center justify-between">
                <h2 id="profile-heading" className={`text-lg font-medium ${heading}`}>
                  Profile
                </h2>
                <div className="flex gap-2">
                  <GhostButton className="rounded-full" onClick={saveProfile}>
                    Save
                  </GhostButton>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
                {/* Logo preview */}
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-white/20 bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {logo ? (
                    <img src={logo} alt="Agent logo" className="h-full w-full object-cover" />
                  ) : data.pro.logo ? (
                    <img src={data.pro.logo} alt="Agent logo" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl" aria-hidden>🏷️</span>
                  )}
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className={fieldLabel}>Agent name</span>
                    <Input
                      value={agentName}
                      onChange={(e) => setAgentName((e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Brokerage</span>
                    <Input
                      value={brokerage}
                      onChange={(e) => setBrokerage((e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label className="sm:col-span-2 block">
                    <span className={fieldLabel}>Logo URL (optional)</span>
                    <Input
                      placeholder="https://…"
                      value={logo}
                      onChange={(e) => setLogo((e.target as HTMLInputElement).value)}
                    />
                  </label>
                  <label className="sm:col-span-2 block">
                    <span className={fieldLabel}>About / Bio (demo)</span>
                    <Textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio((e.target as HTMLTextAreaElement).value)}
                      placeholder="Short intro for your public card…"
                    />
                  </label>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <GhostButton className="w-full sm:w-auto" onClick={() => location.reload()}>
                  Cancel
                </GhostButton>
                <Button className="w-full sm:w-auto" onClick={saveProfile}>
                  Save changes
                </Button>
              </div>
            </section>

            {/* Notifications */}
            <section className={glass} aria-labelledby="notif-heading">
              <h2 id="notif-heading" className={`mb-2 text-lg font-medium ${heading}`}>Notifications</h2>
              <div className="space-y-2">
                <ToggleRow
                  id="notif-email"
                  label="Email summaries"
                  desc="Weekly digest of listing activity and buyer replies."
                  checked={notifEmail}
                  onChange={setNotifEmail}
                />
                <ToggleRow
                  id="notif-requests"
                  label="Record requests"
                  desc="Notify when owners share, decline, or request changes."
                  checked={notifRequests}
                  onChange={setNotifRequests}
                />
              </div>
            </section>

            {/* Security (demo only) */}
            <section className={glass} aria-labelledby="sec-heading">
              <h2 id="sec-heading" className={`mb-2 text-lg font-medium ${heading}`}>Security</h2>
              <div className={`${glassTight} rounded-xl p-3`}>
                <p className="text-white">Password</p>
                <p className={`text-sm ${textMeta}`}>
                  Managed by your auth provider in this demo. Replace with your auth flow.
                </p>
                <div className="mt-2">
                  <Button className="rounded-full" onClick={() => alert("Demo: Open change password flow")}>
                    Change password
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-3">
            {/* Billing link */}
            <section className={glass}>
              <div className="mb-2 flex items-center justify-between">
                <h2 className={`text-lg font-medium ${heading}`}>Billing</h2>
                <a className={`${ctaGhost} rounded-full`} href="/billing">
                  Open
                </a>
              </div>
              <p className={`text-sm ${textMeta}`}>
                View plan, invoices, and payment methods.
              </p>
            </section>

            {/* Connected services (demo) */}
            <section className={glass}>
              <h2 className={`mb-2 text-lg font-medium ${heading}`}>Connected services</h2>
              <ul className="space-y-2">
                <li className={`${glassTight} rounded-xl p-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">CRM (demo)</p>
                      <p className={`text-sm ${textMeta}`}>Export listings & contacts</p>
                    </div>
                    <button
                      className={ctaGhost}
                      onClick={() => alert("Demo: Connect CRM")}
                    >
                      Connect
                    </button>
                  </div>
                </li>
                <li className={`${glassTight} rounded-xl p-3`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white">Calendar (demo)</p>
                      <p className={`text-sm ${textMeta}`}>Sync showings & inspections</p>
                    </div>
                    <button
                      className={ctaGhost}
                      onClick={() => alert("Demo: Connect Calendar")}
                    >
                      Connect
                    </button>
                  </div>
                </li>
              </ul>
            </section>

            {/* Danger zone */}
            <section className={glass} aria-labelledby="danger-heading">
              <h2 id="danger-heading" className={`mb-2 text-lg font-medium ${heading}`}>Danger zone</h2>
              <div className={`${glassTight} rounded-xl p-3`}>
                <p className="text-white">Reset demo data</p>
                <p className={`text-sm ${textMeta}`}>
                  Clears Realtor mock data and reseeds on next load.
                </p>
                <div className="mt-2 flex gap-2">
                  <GhostButton onClick={clearDemoData} className="border-red-400/40 text-red-100 hover:bg-red-500/10">
                    Clear data
                  </GhostButton>
                  <GhostButton
                    onClick={() => location.assign("/")}
                    className="border-white/25 text-white/85"
                  >
                    Sign out (demo)
                  </GhostButton>
                </div>
              </div>
            </section>
          </div>
        </section>

        <div className="h-10" />
      </div>
    </main>
  );
}

/* ---------- Small bits ---------- */
function ToggleRow({
  id,
  label,
  desc,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-start justify-between gap-4 rounded-xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
      <div>
        <div className="text-white">{label}</div>
        {desc && <div className={`text-sm ${textMeta}`}>{desc}</div>}
      </div>
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-5 w-9 cursor-pointer appearance-none rounded-full border border-white/25 bg-white/10 outline-none transition
                   checked:bg-white/90 checked:before:translate-x-4
                   focus:ring-2 focus:ring-white/30
                   before:block before:h-4 before:w-4 before:translate-x-0 before:rounded-full before:bg-white before:transition"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        aria-checked={checked}
        role="switch"
      />
    </label>
  );
}
