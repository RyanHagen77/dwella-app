/**
 * HOMEOWNER MESSAGES INBOX PAGE
 *
 * Shows all conversations with contractors for THIS specific home.
 * Lists connections with unread counts and last message preview.
 * Includes archived conversations (read-only) for disconnected contractors.
 *
 * Location: app/stats/[homeId]/messages/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { MessagesListClient } from "./MessagesListClient";
import { textMeta } from "@/lib/glass";

export default async function HomeMessagesPage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) redirect("/login");

  const { homeId } = await params;
  const userId = session.user.id;

  // Verify user owns this home
  const home = await prisma.home.findFirst({
    where: { id: homeId, ownerId: userId },
    select: { id: true, address: true, city: true, state: true },
  });

  if (!home) redirect("/");

  const addrLine = [home.address, home.city, home.state].filter(Boolean).join(", ");

  // Get connections (active + archived) for this home
  const connections = await prisma.connection.findMany({
    where: {
      homeId,
      homeownerId: userId,
      status: { in: ["ACTIVE", "ARCHIVED"] },
      contractorId: { not: null },
    },
    include: {
      contractor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          proProfile: { select: { businessName: true } },
        },
      },
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
    const lastMessage = conn.messages[0];
    const unreadCount = conn._count.messages;
    const isArchived = conn.status === "ARCHIVED";

    return {
      connectionId: conn.id,
      contractor: {
        name:
          conn.contractor!.proProfile?.businessName ||
          conn.contractor!.name ||
          conn.contractor!.email ||
          "Contractor",
        image: conn.contractor!.image,
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

  const allConversations = connections.filter((c) => c.contractor !== null).map(formatConversation);

  const activeConversations = allConversations.filter((c) => !c.isArchived);
  const archivedConversations = allConversations.filter((c) => c.isArchived);

  // Sort: active by last message, archived by archivedAt
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

  const backHref = `/home/${homeId}`;
  const breadcrumbItems = [{ label: addrLine, href: backHref }, { label: "Messages" }];

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref={backHref}
          backLabel="Back to home"
          title="Messages"
          meta={
            <span className={textMeta}>
              {activeConversations.length} {activeConversations.length === 1 ? "conversation" : "conversations"}
              {totalActiveUnread > 0 ? <span className="ml-2 text-orange-400">({totalActiveUnread} unread)</span> : null}
            </span>
          }
        />

        {/* Body surface (single layer; no glass-on-glass) */}
        <section className="rounded-2xl border border-white/15 bg-black/55 p-6 shadow-2xl backdrop-blur-xl">
          {activeConversations.length === 0 && archivedConversations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
              <p className="mb-2 text-white/80">No conversations yet</p>
              <p className={`text-sm ${textMeta}`}>
                Messages will appear here when contractors reach out or when you start a conversation with a connected
                contractor.
              </p>
            </div>
          ) : (
            <MessagesListClient
              homeId={homeId}
              activeConversations={activeConversations}
              archivedConversations={archivedConversations}
            />
          )}
        </section>
      </div>
    </main>
  );
}