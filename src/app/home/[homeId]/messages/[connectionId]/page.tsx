/**
 * HOMEOWNER INDIVIDUAL CHAT PAGE
 *
 * Real-time messaging interface for homeowner chatting with a contractor.
 * Shows message history and allows sending new messages.
 * Read-only mode for archived (disconnected) connections.
 *
 * Location: app/stats/[homeId]/messages/[connectionId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";

import Breadcrumb from "@/components/ui/Breadcrumb";
import { PageHeader } from "@/components/ui/PageHeader";
import { textMeta } from "@/lib/glass";
import { MessageThread } from "@/app/messages/_components/MessageThread";

export default async function HomeownerChatPage({
  params,
}: {
  params: Promise<{ homeId: string; connectionId: string }>;
}) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) redirect("/login");

  const { homeId, connectionId } = await params;
  const userId = session.user.id;

  // Verify homeowner owns this home + connection (include ARCHIVED for read-only view)
  const connection = await prisma.connection.findFirst({
    where: {
      id: connectionId,
      homeId,
      homeownerId: userId,
      status: { in: ["ACTIVE", "ARCHIVED"] },
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
      home: {
        select: {
          address: true,
          city: true,
          state: true,
        },
      },
    },
  });

  if (!connection || !connection.contractor) notFound();

  const isArchived = connection.status === "ARCHIVED";
  const contractorId = connection.contractor.id;

  const addrLine = [connection.home.address, connection.home.city, connection.home.state]
    .filter(Boolean)
    .join(", ");

  const otherUser = {
    id: connection.contractor.id,
    name:
      connection.contractor.proProfile?.businessName ||
      connection.contractor.name ||
      connection.contractor.email ||
      "Contractor",
    image: connection.contractor.image,
  };

  // Get messages
  const messages = await prisma.message.findMany({
    where: { connectionId },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      attachments: { select: { id: true, filename: true, mimeType: true, url: true } },
      reads: { where: { userId } },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark "own" messages as those NOT from contractor (homeowner side should include transferred history)
  const messagesWithOwnership = messages.map((msg) => ({
    ...msg,
    isOwn: msg.senderId !== contractorId,
  }));

  const backHref = `/home/${homeId}/messages`;
  const breadcrumbItems = [
    { label: addrLine || "Home", href: `/home/${homeId}` },
    { label: "Messages", href: backHref },
    { label: otherUser.name },
  ];

  return (
    <main className="relative min-h-screen text-white">
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <Breadcrumb items={breadcrumbItems} />

        <PageHeader
          backHref={backHref}
          backLabel="Back to messages"
          title={otherUser.name}
          meta={<span className={textMeta}>{addrLine}</span>}
          rightDesktop={
            isArchived ? (
              <Link
                href={`/home/${homeId}/contractors`}
                className="text-sm text-white/70 transition hover:text-white"
              >
                Manage contractors →
              </Link>
            ) : null
          }
        />

        {/* Archived Banner */}
        {isArchived && (
          <div className="flex items-start gap-3 rounded-2xl border border-white/12 bg-white/5 px-4 py-3">
            <div className="mt-0.5 flex-shrink-0 text-white/55" aria-hidden>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
                />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm text-white/80">
                This conversation is archived. You can view past messages but can’t send new ones.
              </p>
              <p className={`mt-1 text-xs ${textMeta}`}>
                If you reconnect with this contractor, messaging will resume automatically.
              </p>
            </div>

            <Link
              href={`/home/${homeId}/contractors`}
              className="flex-shrink-0 text-sm text-white/70 transition hover:text-white"
            >
              Manage →
            </Link>
          </div>
        )}

        {/* Message Thread Surface */}
        <section
          className={[
            "flex min-h-[60vh] flex-col overflow-hidden rounded-2xl border border-white/15 bg-black/55 shadow-2xl backdrop-blur-xl",
            isArchived ? "opacity-90" : "",
          ].join(" ")}
        >
          <div className="min-h-[300px] flex-1 overflow-hidden">
            <MessageThread
              connectionId={connectionId}
              initialMessages={messagesWithOwnership}
              currentUserId={userId}
              otherUser={otherUser}
              contractorId={contractorId}
              readOnly={isArchived}
            />
          </div>
        </section>
      </div>
    </main>
  );
}