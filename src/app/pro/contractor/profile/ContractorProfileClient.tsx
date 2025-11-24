"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { glass, glassTight, heading, textMeta, ctaPrimary } from "@/lib/glass";
import { Modal } from "@/components/ui/Modal";
import { Input, Textarea, fieldLabel } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";

type ProfileData = {
  id: string;
  userId: string;
  type: "CONTRACTOR";
  businessName: string;
  phone: string;
  website: string;
  bio: string;
  licenseNo: string;
  logo: string;
  verified: boolean;
  specialties: string[];
  serviceAreas: string[];
  company: string;
};

type ProfileClientProps = {
  profile: ProfileData;
  user: { name: string };
  titleByType: string;
  websiteHref: string;
};

function withHttp(url?: string | null) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function isValidHttpUrl(url?: string | null) {
  if (!url) return false;
  try {
    const u = new URL(withHttp(url));
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function ContractorProfileClient({
  profile: initialProfile,
  user,
  titleByType,
  websiteHref,
}: ProfileClientProps) {
  // Normalize to avoid null/undefined surprises
  const normalized = useMemo<ProfileData>(() => {
    return {
      ...initialProfile,
      businessName: initialProfile.businessName ?? "",
      phone: initialProfile.phone ?? "",
      website: initialProfile.website ?? "",
      bio: initialProfile.bio ?? "",
      licenseNo: initialProfile.licenseNo ?? "",
      logo: initialProfile.logo ?? "",
      company: initialProfile.company ?? "",
      specialties: Array.isArray(initialProfile.specialties)
        ? initialProfile.specialties
        : [],
      serviceAreas: Array.isArray(initialProfile.serviceAreas)
        ? initialProfile.serviceAreas
        : [],
    };
  }, [initialProfile]);

  const [profile, setProfile] = useState<ProfileData>(normalized);
  const [editMode, setEditMode] = useState(false);
  const [logoMode, setLogoMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    businessName: profile.businessName || "",
    phone: profile.phone || "",
    website: profile.website || "",
    bio: profile.bio || "",
    licenseNo: profile.licenseNo || "",
    specialties: (profile.specialties || []).join(", "),
    serviceAreas: (profile.serviceAreas || []).join(", "),
    company: profile.company || "",
  });

  const [logoUrl, setLogoUrl] = useState(profile.logo || "");

  const computedWebsiteHref = useMemo(() => {
    if (websiteHref && websiteHref.length) return websiteHref;
    const candidate = form.website || profile.website;
    return isValidHttpUrl(candidate) ? withHttp(candidate) : "";
  }, [websiteHref, form.website, profile.website]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        website: form.website.trim(),
        bio: form.bio,
        licenseNo: form.licenseNo.trim(),
        specialties: form.specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        serviceAreas: form.serviceAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        company: form.company.trim(),
      };

      const res = await fetch("/api/pro/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update profile");
      }

      const updated = await res.json();

      setProfile((prev) => ({
        ...prev,
        businessName: updated.businessName ?? payload.businessName,
        phone: updated.phone ?? payload.phone,
        website: updated.website ?? payload.website,
        bio: updated.bio ?? payload.bio,
        licenseNo: updated.licenseNo ?? payload.licenseNo,
        specialties: Array.isArray(updated.specialties)
          ? updated.specialties
          : payload.specialties,
        serviceAreas: Array.isArray(updated.serviceAreas)
          ? updated.serviceAreas
          : payload.serviceAreas,
        company: updated.company ?? payload.company,
      }));

      setEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoSave() {
    const url = (logoUrl || "").trim();
    if (!isValidHttpUrl(url)) {
      setError("Please enter a valid http(s) logo URL.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/pro/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logo: url }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Failed to update logo");
      }

      const updated = await res.json();
      setProfile((p) => ({ ...p, logo: updated.logo ?? url }));
      setLogoMode(false);
    } catch (err) {
      console.error("Error updating logo:", err);
      setError("Failed to update logo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/pro/contractor/dashboard"
          className="text-sm text-white/70 transition hover:text-white"
        >
          ← Back to Contractor Dashboard
        </Link>

        <button
          onClick={() => {
            setError(null);
            setForm({
              businessName: profile.businessName || "",
              phone: profile.phone || "",
              website: profile.website || "",
              bio: profile.bio || "",
              licenseNo: profile.licenseNo || "",
              specialties: (profile.specialties || []).join(", "),
              serviceAreas: (profile.serviceAreas || []).join(", "),
              company: profile.company || "",
            });
            setEditMode(true);
          }}
          className={`${ctaPrimary} px-4 py-2 text-sm`}
        >
          Edit Profile
        </button>
      </div>

      {/* Error banner (page level) */}
      {error && (
        <div className={`${glass} border-l-4 border-red-400`}>
          <p className="text-sm text-red-200">{error}</p>
        </div>
      )}

      {/* Profile Card */}
      <section className={glass}>
        <div className="flex items-start gap-6">
          {/* Logo/Avatar */}
          <button
            type="button"
            className="group relative flex h-24 w-24 flex-shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 transition hover:bg-white/15"
            onClick={() => {
              setError(null);
              setLogoUrl(profile.logo || "");
              setLogoMode(true);
            }}
            aria-label="Update logo"
          >
            {profile.logo ? (
              <>
                <Image
                  src={withHttp(profile.logo)}
                  alt={`${profile.businessName || "Contractor"} logo`}
                  fill
                  sizes="96px"
                  className="rounded-xl object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 opacity-0 transition group-hover:opacity-100">
                  <span className="text-xs text-white">Change</span>
                </div>
              </>
            ) : (
              <div className="text-center">
                <span className="block text-3xl">🔧</span>
                <span className="mt-1 block text-[10px] text-white/60 transition group-hover:text-white/90">
                  Add Logo
                </span>
              </div>
            )}
          </button>

          {/* Info */}
          <div className="flex-1">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <h1 className={`text-2xl font-bold ${heading}`}>
                  {profile.businessName || user.name || "Contractor"}
                </h1>
                <p className={textMeta}>
                  {titleByType}
                  {profile.verified && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-xs text-emerald-100">
                      ✓ Verified
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {profile.phone && (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-white/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  <a
                    href={`tel:${profile.phone}`}
                    className="transition text-white/85 hover:text-white"
                  >
                    {profile.phone}
                  </a>
                </div>
              )}

              {computedWebsiteHref && (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-white/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  <a
                    href={computedWebsiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition text-white/85 hover:text-white hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}

              {profile.licenseNo && (
                <div className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 text-white/60"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <span className="text-white/85">
                    License: {profile.licenseNo}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About / Bio */}
      {profile.bio && (
        <section className={glass}>
          <h2 className={`mb-3 text-lg font-semibold ${heading}`}>About</h2>
          <p className={`leading-relaxed ${textMeta}`}>{profile.bio}</p>
        </section>
      )}

      {/* Specialties & Service Areas */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {profile.specialties.length > 0 && (
          <section className={glass}>
            <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
              Specialties
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.specialties.map((item) => (
                <span key={item} className={glassTight}>
                  {item}
                </span>
              ))}
            </div>
          </section>
        )}

        {profile.serviceAreas.length > 0 && (
          <section className={glass}>
            <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
              Service Areas
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.serviceAreas.map((area) => (
                <span key={area} className={glassTight}>
                  {area}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Work History placeholder */}
      <section className={glass}>
        <h2 className={`mb-3 text-lg font-semibold ${heading}`}>
          Work History
        </h2>
        <div className="py-8 text-center">
          <p className={textMeta}>
            Your completed projects and verified work records will appear here
          </p>
        </div>
      </section>

      {/* Edit Profile Modal */}
      <Modal
        open={editMode}
        onCloseAction={() => setEditMode(false)}
        title="Edit Contractor Profile"
      >
        <div className="space-y-4">
          <label className="block">
            <span className={fieldLabel}>Business Name *</span>
            <Input
              value={form.businessName}
              onChange={(e) =>
                setForm({ ...form, businessName: e.target.value })
              }
              placeholder="Your Business Name"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Company</span>
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="LLC / DBA (optional)"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Phone *</span>
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(555) 123-4567"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Website</span>
            <Input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              placeholder="https://example.com"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>License Number</span>
            <Input
              value={form.licenseNo}
              onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
              placeholder="License #"
            />
          </label>

          <label className="block">
            <span className={fieldLabel}>Specialties</span>
            <Input
              value={form.specialties}
              onChange={(e) =>
                setForm({ ...form, specialties: e.target.value })
              }
              placeholder="HVAC, Plumbing, Electrical"
            />
            <p className="mt-1 text-xs text-white/60">
              Separate with commas
            </p>
          </label>

          <label className="block">
            <span className={fieldLabel}>Service Areas</span>
            <Input
              value={form.serviceAreas}
              onChange={(e) =>
                setForm({ ...form, serviceAreas: e.target.value })
              }
              placeholder="60098, Woodstock, McHenry County"
            />
            <p className="mt-1 text-xs text-white/60">
              Separate with commas
            </p>
          </label>

          <label className="block">
            <span className={fieldLabel}>About Your Business</span>
            <Textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              placeholder="Tell clients about your business..."
            />
          </label>

          <div className="flex justify-end gap-2 pt-4">
            <GhostButton onClick={() => setEditMode(false)}>
              Cancel
            </GhostButton>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Logo Modal */}
      <Modal
        open={logoMode}
        onCloseAction={() => setLogoMode(false)}
        title="Update Logo"
      >
        <div className="space-y-4">
          <p className={`text-sm ${textMeta}`}>
            For now, paste a URL to your logo. We&apos;ll add file upload later.
          </p>

          <label className="block">
            <span className={fieldLabel}>Logo URL</span>
            <Input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
            />
          </label>

          {logoUrl && (
            <div className="rounded-lg border border-white/20 bg-white/5 p-4">
              <p className={`mb-2 text-xs ${textMeta}`}>Preview:</p>
              <div className="relative h-24 w-24">
                <Image
                  src={withHttp(logoUrl)}
                  alt="Logo preview"
                  fill
                  sizes="96px"
                  className="rounded-lg object-cover"
                  onError={() =>
                    setError("That logo URL doesn’t look like a valid image.")
                  }
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <GhostButton onClick={() => setLogoMode(false)}>
              Cancel
            </GhostButton>
            <Button onClick={handleLogoSave} disabled={saving}>
              {saving ? "Saving..." : "Save Logo"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}