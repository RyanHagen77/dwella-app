import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  // Use getServerSession with your authConfig
  const session = await getServerSession(authConfig);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Safely parse body
  const body = (await req.json().catch(() => null)) as
    | { role?: "HOMEOWNER" | "PRO" }
    | null;

  const role = body?.role;

  if (role !== "HOMEOWNER" && role !== "PRO") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { role },
    select: { id: true, email: true, role: true, name: true },
  });

  return NextResponse.json(user);
}