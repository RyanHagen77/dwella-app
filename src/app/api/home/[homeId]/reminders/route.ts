// src/app/api/stats/[homeId]/reminders/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireHomeAccess } from "@/lib/authz";
import { ReminderSchema } from "@/lib/validators";

export const runtime = "nodejs";

type Params = { homeId: string };

export async function POST(req: Request, ctx: { params: Promise<Params> }) {
  const { homeId } = await ctx.params;

  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await requireHomeAccess(homeId, session.user.id);

  const body = await req.json().catch(() => null);
  const parsed = ReminderSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const i of parsed.error.issues) {
      const key = i.path.join(".") || "_form";
      (fieldErrors[key] ||= []).push(i.message);
    }
    return NextResponse.json({ error: { fieldErrors } }, { status: 400 });
  }

  const { title, dueAt, note } = parsed.data;

  const created = await prisma.reminder.create({
    data: {
      homeId,
      title,
      dueAt: new Date(`${dueAt}T00:00:00.000Z`),
      note: note ?? null,                // ← this compiles after migrate+generate
      createdBy: session.user.id ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}