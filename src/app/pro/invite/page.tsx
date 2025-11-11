"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function InviteClientPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    invitedEmail: "",
    invitedName: "",
    message: "",
  });

  // Check if user is PRO
  if (session?.user?.role !== "PRO") {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            You need a contractor account to invite clients.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/invitations/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          role: "HOMEOWNER", // Contractor inviting homeowner
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send invitation");
      }

      setSuccess(true);

      // Reset form
      setFormData({
        invitedEmail: "",
        invitedName: "",
        message: "",
      });

      // Redirect to clients page after 2 seconds
      setTimeout(() => {
        router.push("/pro/clients");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">
            Invitation Sent!
          </h2>
          <p className="text-green-700">
            Your client will receive an email invitation to join MyHomeDox.
          </p>
          <p className="text-sm text-green-600 mt-4">
            Redirecting to your clients page...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 flex items-center gap-2 mb-4"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Invite Client</h1>
        <p className="text-gray-600 mt-2">
          Invite your clients to MyHomeDox and stay connected in one place
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Why invite your clients?
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Centralized communication</li>
          <li>• Professional quotes & invoices</li>
          <li>• Build your work history & reviews</li>
          <li>• Easier scheduling & reminders</li>
        </ul>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            required
            value={formData.invitedEmail}
            onChange={(e) =>
              setFormData({ ...formData, invitedEmail: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="client@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            value={formData.invitedName}
            onChange={(e) =>
              setFormData({ ...formData, invitedName: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Sarah Johnson"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Personal Message <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Hi! I'd like to invite you to MyHomeDox where we can stay connected, track our work together, and I can send you quotes all in one place."
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Invitation"}
          </button>
        </div>
      </form>
    </div>
  );
}