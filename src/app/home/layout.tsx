import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import HomeTopBar from "@/app/home/_components/HomeTopBar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authConfig);
  if (!session?.user) redirect("/login");

  const userId = session.user.id as string;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  // Admins should never see the homeowner pre-claim page
  if (user?.role === "ADMIN") redirect("/admin");

  return (
    <>
      <HomeTopBar />
      {children}
    </>
  );
}