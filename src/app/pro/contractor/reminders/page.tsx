// app/pro/contractor/reminders/page.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { glass, heading, textMeta } from "@/lib/glass";
import Link from "next/link";
import ContractorRemindersClient from "./ContractorRemindersClient";

export const dynamic = "force-dynamic";

export default async function ContractorRemindersPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || session.user.role !== "PRO") {
    redirect("/login");
  }

  const proId = session.user.id;

  const reminders = await prisma.contractorReminder.findMany({
    where: { proId },
    orderBy: [
      { status: "asc" },
      { dueAt: "asc" },
      { createdAt: "desc" },
    ],
  });

  const serialized = reminders.map((r) => ({
    id: r.id,
    title: r.title,
    note: r.note,
    status: r.status as "PENDING" | "DONE",
    dueAt: r.dueAt ? r.dueAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      {/* Simple breadcrumb consistent with other pro pages */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-white/70">
        <Link href="/pro/contractor/dashboard" className="transition hover:text-white">
          Dashboard
        </Link>
        <span className="text-white/50">/</span>
        <span className="text-white">My Reminders</span>
      </nav>

      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className={heading}>My Reminders</h1>
          <p className={textMeta + " mt-1"}>
            Personal follow-ups and tasks that only you can see.
          </p>
        </div>
      </header>

      <div className={glass + " rounded-2xl p-4 sm:p-5"}>
        <ContractorRemindersClient initialReminders={serialized} />
      </div>
    </div>
  );
}