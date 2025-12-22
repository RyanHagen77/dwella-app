"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button, GhostButton } from "@/components/ui/Button";
import { textMeta } from "@/lib/glass";

import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";
import { TransfersSection } from "@/components/transfer/TransfersSection";

import {
  formFieldShell,
  formInputInner,
  formLabelCaps,
  formHelperText,
  formSectionSurface,
} from "@/components/ui/formFields";

type ProfileForm = {
  name: string;
  email: string;
};

type MessageState =
  | {
      type: "success" | "error";
      text: string;
    }
  | null;

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState<MessageState>(null);
  const [shareOpen, setShareOpen] = React.useState(false);

  const [form, setForm] = React.useState<ProfileForm>({
    name: "",
    email: "",
  });

  // Load user data into the form
  React.useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  async function handleSave() {
    if (!session?.user) return;

    // No-op if nothing changed
    if (form.name === (session.user.name || "") && form.email === (session.user.email || "")) {
      setMessage({ type: "success", text: "No changes to save." });
      window.setTimeout(() => setMessage(null), 2500);
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setMessage({ type: "success", text: "Profile updated successfully." });
      window.setTimeout(() => setMessage(null), 3000);
    } catch {
      setMessage({ type: "error", text: "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    if (!session?.user) return;
    setForm({
      name: session.user.name || "",
      email: session.user.email || "",
    });
    setMessage(null);
  }

  // Loading / unauth guard
  if (status === "loading") {
    return (
      <main className="relative min-h-screen text-white flex items-center justify-center">
        <Bg />
        <p className="text-white/70 text-sm">Loading your account…</p>
      </main>
    );
  }

  if (!session?.user) {
    return (
      <main className="relative min-h-screen text-white flex items-center justify-center">
        <Bg />
        <p className="text-white/70 text-sm">You need to be signed in to view this page.</p>
      </main>
    );
  }

  const breadcrumbItems = [{ label: "Home", href: "/home" }, { label: "Account Settings" }];

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref="/home"
          backLabel="Back to home"
          title="Account Settings"
          meta={<span className={textMeta}>Manage your Dwella profile, security, and access.</span>}
        />

        {/* Success/Error Message (standard inline block) */}
        {message && (
          <div
            aria-live="polite"
            className={[
              "rounded-2xl border p-3 text-sm",
              message.type === "success"
                ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                : "border-red-500/35 bg-red-500/10 text-red-100",
            ].join(" ")}
          >
            <span className="font-semibold">{message.type === "success" ? "✓ " : "✗ "}</span>
            {message.text}
          </div>
        )}

        {/* Profile (single body surface, no glass-on-glass) */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-white">Profile</h2>
            <p className={`text-xs ${textMeta}`}>{session.user.email}</p>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className={formLabelCaps}>Name</span>
              <div className={formFieldShell}>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  className={formInputInner}
                  placeholder="Enter your name"
                />
              </div>
            </label>

            <label className="block">
              <span className={formLabelCaps}>Email</span>
              <div className={formFieldShell}>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={formInputInner}
                  placeholder="your.email@example.com"
                />
              </div>
              <p className={formHelperText}>This email is used for login and notifications.</p>
            </label>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <GhostButton type="button" onClick={handleCancel} disabled={saving}>
              Cancel
            </GhostButton>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Security</h2>

          <div className="mt-4 space-y-3">
            <div className={formSectionSurface}>
              <p className="text-sm text-white/80">Change your password for this account.</p>
              <div className="mt-3">
                <GhostButton type="button" onClick={() => router.push("/account/change-password")}>
                  Change password
                </GhostButton>
              </div>
            </div>

            <div className={formSectionSurface}>
              <p className="text-sm text-white/80">Sign out of your account on this device.</p>
              <div className="mt-3">
                <GhostButton
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login?role=homeowner" })}
                >
                  Sign out
                </GhostButton>
              </div>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Subscription</h2>

          <div className={`mt-4 ${formSectionSurface}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-medium text-white">Dwella Basic</p>
                <p className={`mt-1 text-sm ${textMeta}`}>Manage unlimited homes and maintenance records.</p>
              </div>

              <span className="inline-flex items-center rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-100">
                Active
              </span>
            </div>

            <div className="mt-4">
              <GhostButton type="button" onClick={() => router.push("/billing")}>
                Manage billing
              </GhostButton>
            </div>
          </div>
        </section>

        {/* Shared Access */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-white">Shared access</h2>
          <p className={`mt-2 text-sm ${textMeta}`}>Manage who has access to your homes and what they can do.</p>

          <div className="mt-4">
            <GhostButton type="button" onClick={() => setShareOpen(true)}>
              Manage access
            </GhostButton>
          </div>
        </section>

        {/* Home Transfers (leave as-is; ensure it matches its own standard internally) */}
        <TransfersSection />

        {/* Danger Zone (no alerts; inline state + confirm ok) */}
        <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 backdrop-blur-xl">
          <h2 className="text-lg font-semibold text-red-200">Danger zone</h2>
          <p className={`mt-2 text-sm ${textMeta}`}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => {
                const ok = confirm("Are you sure you want to delete your profile? This cannot be undone.");
                if (!ok) return;

                setMessage({
                  type: "error",
                  text: "Account deletion is not implemented yet.",
                });
                window.setTimeout(() => setMessage(null), 3500);
              }}
              className="rounded-full border border-red-400/25 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-100 transition-colors hover:bg-red-400/15 hover:border-red-300/35"
            >
              Delete account
            </button>
          </div>
        </section>

        <div className="h-12" />
      </div>

      {/* Shared Access Modal */}
      <ShareAccessModal
        open={shareOpen}
        onCloseAction={() => setShareOpen(false)}
      />
      </main>
  );
}

/** Shared background, matches other homeowner pages */
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