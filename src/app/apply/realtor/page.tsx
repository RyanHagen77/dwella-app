"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RealtorApplyForm = {
  name: string;
  email: string;
  password: string;
  phone: string;
  businessName: string;
  brokerageName: string;
  licenseNo: string;
  website: string;
  bio: string;
  serviceAreas: string;
};

export default function RealtorApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<RealtorApplyForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    brokerageName: "",
    licenseNo: "",
    website: "",
    bio: "",
    serviceAreas: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!formData.licenseNo) {
        throw new Error("Real estate license number is required");
      }

      // Convert comma-separated string to array
      const payload = {
        ...formData,
        serviceAreas: formData.serviceAreas
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s),
      };

      const response = await fetch("/api/pro/realtor/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string })?.error || "Failed to submit application");
      }

      router.push("/pro/realtor/pending");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8">
        <Link href="/apply" className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
          ← Back to account types
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">Apply as a Realtor</h1>
        <p className="mt-2 text-gray-600">Join MyDwella and enhance your client experience</p>
      </div>

      <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
        <h3 className="mb-2 font-semibold text-purple-900">Why join as a Realtor?</h3>
        <ul className="space-y-1 text-sm text-purple-800">
          <li>✓ Add verified home records to listings</li>
          <li>✓ Show buyers complete maintenance history</li>
          <li>✓ Recommend trusted contractors to clients</li>
          <li>✓ Stay connected with clients post-sale</li>
          <li>✓ Build long-term client relationships</li>
        </ul>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        {/* Personal Information */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Personal Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Jane Smith"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="jane@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Minimum 8 characters"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Professional Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Your Name/Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Jane Smith Real Estate"
              />
              <p className="mt-1 text-xs text-gray-500">How you want to appear to clients</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Brokerage Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.brokerageName}
                onChange={(e) => setFormData({ ...formData, brokerageName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Keller Williams Realty"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Real Estate License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="475.123456"
              />
              <p className="mt-1 text-xs text-gray-500">License verification required for approval</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Website <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Service Areas <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.serviceAreas}
                onChange={(e) => setFormData({ ...formData, serviceAreas: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Chicago, Evanston, Oak Park"
              />
              <p className="mt-1 text-xs text-gray-500">
                Add cities or areas where you work, separated by commas
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                About Your Practice <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
                placeholder="Tell us about your real estate practice, areas you serve, and your approach to client service..."
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-medium text-white hover:from-purple-700 hover:to-pink-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            We&apos;ll verify your license and review within 1-2 business days
          </p>
        </div>
      </form>
    </main>
  );
}