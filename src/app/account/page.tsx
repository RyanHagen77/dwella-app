"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { glass, ctaGhost, ctaPrimary, heading } from "@/lib/glass";
import Image from "next/image";

export default function AccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
  });

  // Load user data
  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || "",
        email: session.user.email || "",
      });
    }
  }, [session]);

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      setMessage("✓ Profile updated successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      setMessage("✗ Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="relative min-h-screen text-white">
      {/* Fixed background */}
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

      <div className="mx-auto max-w-3xl p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h1 className={`text-3xl font-semibold tracking-tight ${heading}`}>
            Account Settings
          </h1>
          <button
            onClick={() => router.back()}
            className={`${ctaGhost} flex items-center gap-2`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.startsWith("✓") 
              ? "bg-green-500/20 border border-green-500/30 text-green-200" 
              : "bg-red-500/20 border border-red-500/30 text-red-200"
          }`}>
            {message}
          </div>
        )}

        {/* Profile Card */}
        <section className={glass}>
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>Profile Information</h2>
          <div className="space-y-4">
            <label className="block">
              <span className="text-white/70 text-sm font-medium mb-2 block">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg bg-black/30 text-white placeholder:text-white/50 border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors"
                placeholder="Enter your name"
              />
            </label>

            <label className="block">
              <span className="text-white/70 text-sm font-medium mb-2 block">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg bg-black/30 text-white placeholder:text-white/50 border border-white/20 p-3 focus:border-white/40 focus:outline-none transition-colors"
                placeholder="your.email@example.com"
              />
            </label>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className={ctaPrimary}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setForm({
                name: session?.user?.name || "",
                email: session?.user?.email || "",
              })}
              className={ctaGhost}
            >
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
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>Subscription</h2>
          <div className="bg-white/5 rounded-lg p-4 border border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-white font-medium">MyHomeDox Basic</p>
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
          <h2 className={`mb-4 text-lg font-medium ${heading}`}>Shared Access</h2>
          <p className="text-white/70 text-sm mb-4">
            Manage who has access to your homes and what they can do
          </p>
          <button
            onClick={() => router.push("/access")}
            className={ctaGhost}
          >
            Manage Access
          </button>
        </section>

        {/* Danger Zone */}
        <section className={`${glass} border-red-500/30`}>
          <h2 className={`mb-4 text-lg font-medium text-red-400`}>Danger Zone</h2>
          <p className="text-white/70 text-sm mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to delete your profile? This cannot be undone.")) {
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
    </main>
  );
}