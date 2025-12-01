/**
 * ADMIN USER DETAIL PAGE
 *
 * View and manage individual user details.
 * Shows profile, homes, connections, and admin actions.
 *
 * Location: app/admin/users/[id]/page.tsx
 */

import type { ElementType } from "react";
import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Home,
  Link2,
  Shield,
  Briefcase,
  MapPin,
} from "lucide-react";
import UserActions from "../../_components/UserActions";

export default async function UserDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      proProfile: true,
      homes: {
        take: 10,
      },
      _count: {
        select: {
          homes: true,
          connectionsAsHomeowner: true,
          connectionsAsContractor: true,
        },
      },
    },
  });

  if (!user) {
    notFound();
  }

  const isPro = user.role === "PRO";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className={"text-2xl font-bold " + heading}>
            {user.name || "Unnamed User"}
          </h1>
          <p className={textMeta}>{user.email || "No email"}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={glass}>
            <h2 className={"mb-4 text-lg font-semibold " + heading}>
              Profile
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoItem icon={User} label="Name" value={user.name || "Not set"} />
              <InfoItem icon={Mail} label="Email" value={user.email || "Not set"} />
              <InfoItem icon={Shield} label="Role" value={user.role} />
              <InfoItem
                icon={Calendar}
                label="Joined"
                value={new Date(user.createdAt).toLocaleDateString()}
              />
              <InfoItem
                icon={Mail}
                label="Email Verified"
                value={user.emailVerified ? "Yes" : "No"}
              />
              {isPro && (
                <InfoItem
                  icon={Briefcase}
                  label="Pro Status"
                  value={user.proStatus || "None"}
                />
              )}
            </div>
          </section>

          {isPro && user.proProfile && (
            <section className={glass}>
              <h2 className={"mb-4 text-lg font-semibold " + heading}>
                Professional Profile
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InfoItem
                  icon={Briefcase}
                  label="Business Name"
                  value={user.proProfile.businessName || "Not set"}
                />
                <InfoItem
                  icon={Briefcase}
                  label="Type"
                  value={user.proProfile.type || "Not set"}
                />
                <InfoItem
                  icon={Mail}
                  label="Phone"
                  value={user.proProfile.phone || "Not set"}
                />
                <InfoItem
                  icon={Shield}
                  label="License"
                  value={user.proProfile.licenseNo || "Not set"}
                />
                <InfoItem
                  icon={Shield}
                  label="Verified"
                  value={user.proProfile.verified ? "Yes" : "No"}
                />
              </div>

              {user.proProfile.website && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <span className={"text-xs " + textMeta}>Website</span>
                  <a
                    href={
                      user.proProfile.website.startsWith("http")
                        ? user.proProfile.website
                        : "https://" + user.proProfile.website
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-400 hover:text-blue-300"
                  >
                    {user.proProfile.website}
                  </a>
                </div>
              )}

              {user.proProfile.bio && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <span className={"text-xs " + textMeta}>Bio</span>
                  <p className="mt-1 text-white/80">{user.proProfile.bio}</p>
                </div>
              )}

              {user.proProfile.serviceAreas &&
                user.proProfile.serviceAreas.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <span className={"text-xs " + textMeta}>Service Areas</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.proProfile.serviceAreas.map((area: string) => (
                        <span
                          key={area}
                          className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {user.proProfile.specialties &&
                user.proProfile.specialties.length > 0 && (
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <span className={"text-xs " + textMeta}>Specialties</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {user.proProfile.specialties.map((item: string) => (
                        <span
                          key={item}
                          className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-sm text-white/80"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </section>
          )}

          {user.homes && user.homes.length > 0 && (
            <section className={glass}>
              <div className="mb-4 flex items-center justify-between">
                <h2 className={"text-lg font-semibold " + heading}>
                  Homes ({user._count.homes})
                </h2>
                <Link
                  href={"/admin/homes?ownerId=" + user.id}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  View all
                </Link>
              </div>
              <div className="space-y-2">
                {user.homes.map((home) => (
                  <Link
                    key={home.id}
                    href={"/admin/homes/" + home.id}
                    className="flex items-center gap-3 rounded-lg bg-white/5 p-3 transition-colors hover:bg-white/10"
                  >
                    <MapPin size={16} />
                    <div>
                      <p className="text-white">{home.address}</p>
                      <p className={"text-xs " + textMeta}>
                        {home.city}, {home.state}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <section className={glass}>
            <h2 className={"mb-4 text-lg font-semibold " + heading}>Stats</h2>
            <div className="space-y-3">
              <StatItem
                icon={Home}
                label="Owned Homes"
                value={user._count.homes}
              />
              <StatItem
                icon={Link2}
                label="Connections (as owner)"
                value={user._count.connectionsAsHomeowner}
              />
              {isPro && (
                <StatItem
                  icon={Link2}
                  label="Connections (as pro)"
                  value={user._count.connectionsAsContractor}
                />
              )}
            </div>
          </section>

          <section className={glass}>
            <h2 className={"mb-4 text-lg font-semibold " + heading}>Actions</h2>
            <UserActions
              user={{ id: user.id, role: user.role, proStatus: user.proStatus }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5">
        <Icon size={12} className="text-white/50" />
        <span className={"text-xs " + textMeta}>{label}</span>
      </div>
      <p className="text-white">{value}</p>
    </div>
  );
}

function StatItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={16} className="text-white/50" />
        <span className={textMeta}>{label}</span>
      </div>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}