// app/pro/contractor/profile/page.tsx
import Image from "next/image";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContractorProfileClient } from "./ContractorProfileClient";

export const dynamic = "force-dynamic";

function withHttp(url?: string | null) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

export default async function Page() {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  const userId = String(session.user.id);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { proProfile: true },
  });

  if (!user?.proProfile || user.proProfile.type !== "CONTRACTOR") {
    redirect("/pro/contractor/dashboard");
  }

  const p = user.proProfile;
  const profile = {
    id: p.id,
    userId,
    type: "CONTRACTOR" as const,
    businessName: p.businessName ?? "",
    phone: p.phone ?? "",
    website: p.website ?? "",
    bio: p.bio ?? "",
    licenseNo: p.licenseNo ?? "",
    logo: p.logo ?? "",
    verified: p.verified ?? false,
    specialties: Array.isArray(p.specialties) ? p.specialties : [],
    serviceAreas: Array.isArray(p.serviceAreas) ? p.serviceAreas : [],
    company: p.company ?? "",
  };

  const websiteHref = withHttp(profile.website);

  return (
    <main className="relative min-h-screen text-white">
      {/* Background */}
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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.6))]" />
      </div>

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        <ContractorProfileClient
          profile={profile}
          user={{ name: user.name ?? "" }}
          titleByType="Contractor"
          websiteHref={websiteHref}
        />
      </div>
    </main>
  );
}