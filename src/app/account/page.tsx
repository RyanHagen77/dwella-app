"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { glass, ctaGhost, ctaPrimary, heading } from "@/lib/glass";
import Image from "next/image";
import { ShareAccessModal } from "@/app/home/_components/ShareAccessModal";
import { TransfersSection } from "@/components/transfers/TransfersSection";

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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [shareOpen, setShareOpen] = useState(false);

  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
  });

  // Load user data into the form
  useEffect(() => {
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
    if (
      form.name === (session.user.name || "") &&
      form.email === (session.user.email || "")
    ) {
      setMessage({ type: "success", text: "No changes to save" });
      setTimeout(() => setMessage(null), 2500);
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

      setMessage({ type: "success", text: "Profile updated successfully" });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to update profile" });
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
        <p className="text-white/70 text-sm">
          You need to be signed in to view this page.
        </p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-3xl p-6 space-y-6">
        {/* Header (matches messages style) */}
        <section className={glass}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <button
                onClick={() => router.back()}
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
                aria-label="Back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <h1 className={`text-2xl font-bold ${heading}`}>
                  Account Settings
                </h1>
                <p className="text-sm text-white/65 mt-1">
                  Manage your Dwella profile, security, and access.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Success/Error Message */}
        {message && (
          <div
            aria-live="polite"
            className={`p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500/30 text-green-200"
                : "bg-red-500/20 border border-red-500/30 text-red-200"
            }`}
          >
            {message.type === "success" ? "✓ " : "✗ "}
            {message.text}
          </div>
        )}

        {/* Profile Card */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>
            Profile Information
          </h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-white/70 text-sm font-medium mb-2 block">
                Name
              </span>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full rounded-lg bg-black/30 text-white placeholder:text-white/50 border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors"
                placeholder="Enter your name"
              />
            </label>

            <label className="block">
              <span className="text-white/70 text-sm font-medium mb-2 block">
                Email
              </span>
              <input
                type="email"
                value={form.email}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full rounded-lg bg-black/30 text-white placeholder:text-white/50 border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors"
                placeholder="your.email@example.com"
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={ctaPrimary}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={handleCancel} className={ctaGhost}>
              Cancel
            </button>
          </div>
        </section>

        {/* Security */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>Security</h2>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/account/change-password")}
              className={`${ctaGhost} w-full sm:w-auto`}
            >
              Change Password
            </button>
            <div className="pt-3 border-t border-white/10">
              <p className="text-sm text-white/60 mb-3">
                Sign out of your account on this device
              </p>
              <button
                onClick={() => signOut({ callbackUrl: "/login?role=homeowner" })}
                className={`${ctaGhost} w-full sm:w-auto`}
              >
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* Subscription */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>
            Subscription
          </h2>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium">Dwella Basic</p>
                <p className="text-white/60 text-sm mt-1">
                  Manage unlimited homes and maintenance records
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
                Active
              </span>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.push("/billing")}
              className={ctaGhost}
            >
              Manage Billing
            </button>
          </div>
        </section>

        {/* Shared Access */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>
            Shared Access
          </h2>
          <p className="text-white/70 text-sm mb-4">
            Manage who has access to your homes and what they can do.
          </p>
          <button
            onClick={() => setShareOpen(true)}
            className={ctaGhost}
          >
            Manage Access
          </button>
        </section>

        {/* Home Transfers */}
        <TransfersSection />

        {/* Danger Zone */}
        <section className={`${glass} border-red-500/30`}>
          <h2 className="mb-4 text-lg font-medium text-red-400">
            Danger Zone
          </h2>
          <p className="text-white/70 text-sm mb-4">
            Permanently delete your account and all associated data. This action
            cannot be undone.
          </p>
          <button
            onClick={() => {
              if (
                confirm(
                  "Are you sure you want to delete your profile? This cannot be undone."
                )
              ) {
                // TODO: Implement profile deletion
                alert("Account deletion not yet implemented");
              }
            }}
            className="px-4 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-colors text-sm"
          >
            Delete Account
          </button>
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