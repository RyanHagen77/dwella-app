import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TopBar, type TopBarLink } from "@/components/TopBar";

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

  // Admins should never see the homeowner pre-claim page
  if (user?.role === "ADMIN") redirect("/admin");

  // Global header links (keep empty for now, or add Help, Support, etc.)
  const links: TopBarLink[] = [];

  return (
    <>
      <TopBar links={links} />
      {children}
    </>
  );
}