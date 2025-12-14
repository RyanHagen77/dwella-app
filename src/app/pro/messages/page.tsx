/**
 * MESSAGES INBOX PAGE
 *
 * Shows all active conversations for ANY pro type (contractor, realtor, inspector).
 * Lists connections with unread counts and last messages preview.
 * Includes archived conversations (read-only) for disconnected homeowners.
 *
 * Location: app/(pro)/pro/messages/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { MessageListClient } from "./MessageListClient";

export default async function MessagesPage() {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id || session.user.role !== "PRO") {
    redirect("/login");
  }

  const userId = session.user.id;

  const connections = await prisma.connection.findMany({
    where: {
      OR: [{ contractorId: userId }, { realtorId: userId }, { inspectorId: userId }],
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    include: {
      homeowner: { select: { id: true, name: true, email: true, image: true } },
      home: { select: { address: true, city: true, state: true } },
      messages: {
        take: 1,
        orderBy: { createdAt: "desc" },
        include: { reads: { where: { userId } } },
      },
      _count: {
        select: {
          messages: {
            where: {
              senderId: { not: userId },
              reads: { none: { userId } },
            },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const formatConversation = (conn: (typeof connections)[number]) => {
    const lastMessage = conn.messages[0] ?? null;
    const unreadCount = conn._count.messages ?? 0;
    const isArchived = conn.status === "ARCHIVED";

    const homeownerName = conn.homeowner?.name || conn.homeowner?.email || "Homeowner";

    return {
      connectionId: conn.id,
      homeowner: { name: homeownerName, image: conn.homeowner?.image ?? null },
      property: {
        address: conn.home?.address ?? "",
        city: conn.home?.city ?? "",
        state: conn.home?.state ?? "",
      },
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
            isRead: lastMessage.reads.length > 0,
          }
        : null,
      unreadCount: isArchived ? 0 : unreadCount,
      isArchived,
      archivedAt: conn.archivedAt,
    };
  };

  const allConversations = connections
    .filter((c) => c.homeowner && c.home)
    .map(formatConversation);

  const activeConversations = allConversations.filter((c) => !c.isArchived);
  const archivedConversations = allConversations.filter((c) => c.isArchived);

  activeConversations.sort((a, b) => {
    const aDate = a.lastMessage?.createdAt || new Date(0);
    const bDate = b.lastMessage?.createdAt || new Date(0);
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  archivedConversations.sort((a, b) => {
    const aDate = a.archivedAt || new Date(0);
    const bDate = b.archivedAt || new Date(0);
    return new Date(bDate).getTime() - new Date(aDate).getTime();
  });

  const totalActiveUnread = activeConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // NOTE: this route is for ANY pro type. If you have a shared /pro/dashboard, use it.
  // Keeping your existing contractor dashboard link so it doesn't break.
  const dashboardHref = "/pro/contractor/dashboard";

  return (
    <main className="relative min-h-screen text-white">

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href={dashboardHref}
            className="text-white/70 hover:text-white transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-white/50">/</span>
          <span className="text-white">Messages</span>
        </nav>

        {/* Header (single glass card) */}
        <section className={glass}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3">
              <Link
                href={dashboardHref}
                className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-colors hover:bg-white/15"
                aria-label="Back to dashboard"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                  />
                </svg>
              </Link>

              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl font-bold ${heading}`}>Messages</h1>

                <div className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${textMeta}`}>
                  <span>
                    {activeConversations.length} active conversation
                    {activeConversations.length === 1 ? "" : "s"}
                  </span>

                  {totalActiveUnread > 0 && (
                    <>
                      <span className="text-white/35">•</span>
                      <span className="text-orange-300 font-medium">
                        {totalActiveUnread} unread
                      </span>
                    </>
                  )}

                  {archivedConversations.length > 0 && (
                    <>
                      <span className="text-white/35">•</span>
                      <span>{archivedConversations.length} archived</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ✅ Threads “floating” (NO glass wrapper) */}
        {activeConversations.length === 0 && archivedConversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
            <p className="mb-2 text-white/80">No conversations yet</p>
            <p className={`text-sm ${textMeta}`}>
              Messages will appear here when homeowners reach out or when you
              start a conversation with a connected homeowner.
            </p>
          </div>
        ) : (
          <MessageListClient
            activeConversations={activeConversations}
            archivedConversations={archivedConversations}
          />
        )}
      </div>
    </main>
  );
}