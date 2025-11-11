"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProType = "CONTRACTOR" | "REALTOR" | "INSPECTOR";

type ProApplyForm = {
  // Personal info
  name: string;
  email: string;
  password: string;
  phone: string;

  // Business info
  businessName: string;
  type: ProType;
  licenseNo: string;
  website: string;

  // Additional
  bio: string;
};

export default function ProApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const [formData, setFormData] = useState<ProApplyForm>({
    name: "",
    email: "",
    password: "",
    phone: "",
    businessName: "",
    type: "CONTRACTOR",
    licenseNo: "",
    website: "",
    bio: "",
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/pro/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error((data as { error?: string })?.error || "Failed to submit application");
      }

      router.push("/pro/pending");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
      setLoading(false);
    }
  };

  // Dynamic content based on pro type
  const getTypeDescription = () => {
    switch (formData.type) {
      case "CONTRACTOR":
        return {
          title: "Contractor Account",
          benefits: [
            "Manage all your clients in one place",
            "Send professional quotes and estimates",
            "Track job history and warranties",
            "Build your reputation with client reviews",
            "Get discovered by homeowners needing work",
          ],
          bioPlaceholder:
            "Tell us about your business, specialties (HVAC, plumbing, electrical, etc.), years of experience, and what makes you unique...",
        };
      case "REALTOR":
        return {
          title: "Realtor Account",
          benefits: [
            "Connect with your clients' homes",
            "Help clients track their home maintenance",
            "Recommend trusted contractors to clients",
            "Stay connected post-sale",
            "Build long-term client relationships",
          ],
          bioPlaceholder:
            "Tell us about your real estate practice, areas you serve, types of properties you specialize in, and your approach to client service...",
        };
      case "INSPECTOR":
        return {
          title: "Home Inspector Account",
          benefits: [
            "Connect inspection reports to client homes",
            "Track follow-up recommendations",
            "Refer trusted contractors for repairs",
            "Maintain client relationships",
            "Build your professional reputation",
          ],
          bioPlaceholder:
            "Tell us about your inspection business, certifications, areas you serve, types of inspections you perform, and your experience...",
        };
    }
  };

  const typeInfo = getTypeDescription();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-8">
        <Link
          href="/login"
          className="mb-4 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          ← Back to login
        </Link>

        <h1 className="text-3xl font-bold text-gray-900">
          Apply for {typeInfo.title}
        </h1>
        <p className="mt-2 text-gray-600">Join MyHomeDox as a verified professional</p>
      </div>

      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <h3 className="mb-2 font-semibold text-blue-900">
          Why join as a {formData.type === "CONTRACTOR" ? "Contractor" : formData.type === "REALTOR" ? "Realtor" : "Home Inspector"}?
        </h3>
        <ul className="space-y-1 text-sm text-blue-800">
          {typeInfo.benefits.map((benefit, index) => (
            <li key={index}>✓ {benefit}</li>
          ))}
        </ul>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
        {/* Professional Type - First Field */}
        <div>
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Professional Type</h2>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              I am a <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type: e.target.value as ProType,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="CONTRACTOR">Contractor</option>
              <option value="REALTOR">Realtor</option>
              <option value="INSPECTOR">Home Inspector</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {formData.type === "CONTRACTOR" && "Plumber, electrician, HVAC, handyman, etc."}
              {formData.type === "REALTOR" && "Real estate agent or broker"}
              {formData.type === "INSPECTOR" && "Licensed home inspector"}
            </p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="border-t border-gray-200 pt-6">
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="John Smith"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="john@example.com"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="border-t border-gray-200 pt-6">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Business Information</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {formData.type === "CONTRACTOR" && "Business Name"}
                {formData.type === "REALTOR" && "Brokerage Name"}
                {formData.type === "INSPECTOR" && "Company Name"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder={
                  formData.type === "CONTRACTOR"
                    ? "Mike's HVAC Service"
                    : formData.type === "REALTOR"
                    ? "Keller Williams Realty"
                    : "ABC Home Inspections"
                }
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                {formData.type === "CONTRACTOR" && "License Number"}
                {formData.type === "REALTOR" && "Real Estate License Number"}
                {formData.type === "INSPECTOR" && "Inspector License/Certification"}{" "}
                <span className="text-gray-400">(optional but recommended)</span>
              </label>
              <input
                type="text"
                value={formData.licenseNo}
                onChange={(e) => setFormData({ ...formData, licenseNo: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder={
                  formData.type === "CONTRACTOR"
                    ? "IL-HVAC-12345"
                    : formData.type === "REALTOR"
                    ? "475.123456"
                    : "ASHI #123456"
                }
              />
              <p className="mt-1 text-xs text-gray-500">
                Providing a license number helps build trust with clients
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Website <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                About {formData.type === "CONTRACTOR" ? "Your Business" : formData.type === "REALTOR" ? "Your Practice" : "Your Services"}{" "}
                <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                placeholder={typeInfo.bioPlaceholder}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-medium text-white transition hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
          <p className="mt-3 text-center text-xs text-gray-500">
            Wee&apos;ll review your application and get back to you within 1-2 business days
          </p>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}