"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function RegisterPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  // Fetch invitation details if token exists
  useEffect(() => {
    if (token) {
      fetchInvitationDetails(token);
    }
  }, [token]);

  async function fetchInvitationDetails(token: string) {
    try {
      const response = await fetch(`/api/invitations/${token}`);
      const data = await response.json();

      if (response.ok) {
        // Pre-fill email and name if provided
        setForm({
          ...form,
          email: data.invitedEmail,
          name: data.invitedName || "",
        });
        setInvitationData(data);
      } else {
        setMsg(data.error || "Invalid invitation link");
      }
    } catch (error) {
      setMsg("Failed to load invitation");
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          invitationToken: token, // Pass token to register API
        }),
      });

      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(j.error || "Failed to register");
        setLoading(false);
        return;
      }

      // Success - redirect to login
      window.location.href = "/login";
    } catch (error) {
      setMsg("Registration failed");
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-md p-6 space-y-4">
      {invitationData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>{invitationData.inviterName}</strong>
            {invitationData.inviterCompany && ` (${invitationData.inviterCompany})`} has
            invited you to join MyHomeDox
          </p>
          {invitationData.message && (
            <p className="text-sm text-blue-700 mt-2 italic">
              "{invitationData.message}"
            </p>
          )}
        </div>
      )}

      <h1 className="text-2xl font-semibold">
        {invitationData ? "Accept Invitation" : "Create account"}
      </h1>

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          className="w-full border rounded p-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="w-full border rounded p-2"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          disabled={!!invitationData} // Disable if from invitation
        />
        <input
          className="w-full border rounded p-2"
          type="password"
          placeholder="Password (min 8)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={8}
        />
        <button
          className="w-full rounded p-2 bg-black text-white disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Creating account..." : invitationData ? "Accept & Create Account" : "Create account"}
        </button>
      </form>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <a href="/login" className="text-blue-600 hover:underline">
          Sign in
        </a>
      </p>
    </main>
  );
}