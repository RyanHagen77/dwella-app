// =============================================================================
// app/home/layout.tsx
// =============================================================================
// Redirects user to their most recent stats, or shows pre-claim UI

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GlobalHeader, type TopBarLink } from "@/components/GlobalHeader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "ADMIN") redirect("/admin");

  const links: TopBarLink[] = []; // keep empty for now

  return (
    <>
      <GlobalHeader links={links} />
      {children}
    </>
  );
}