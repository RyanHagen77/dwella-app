/**
 * HOMEOWNER INDIVIDUAL CHAT PAGE
 *
 * Real-time messaging interface for homeowner chatting with a contractor.
 * Shows message history and allows sending new messages.
 * Read-only mode for archived (disconnected) connections.
 *
 * Location: app/home/[homeId]/messages/[connectionId]/page.tsx
 */

export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { glass, heading, textMeta } from "@/lib/glass";
import { MessageThread } from "@/app/messages/_components/MessageThread";
import ChatBreadcrumb from "@/components/ui/ChatBreadcrumb";

export default async function HomeownerChatPage({
  params,
}: {
  params: Promise<{ homeId: string; connectionId: string }>;
}) {
  const session = await getServerSession(authConfig);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { homeId, connectionId } = await params;
  const userId = session.user.id;

  // Get connection details - verify homeowner owns this home and connection
  // Include ARCHIVED status so we can show read-only view
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
          proProfile: {
            select: {
              businessName: true,
            },
          },
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

  if (!connection || !connection.contractor) {
    notFound();
  }

  const isArchived = connection.status === "ARCHIVED";
  const contractorId = connection.contractor.id;

  // Get messages
  const messages = await prisma.message.findMany({
    where: { connectionId },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      attachments: {
        select: {
          id: true,
          filename: true,
          mimeType: true,
          url: true,
        },
      },
      reads: {
        where: { userId },
      },
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  // Mark messages as "own" if NOT from contractor (i.e., from any homeowner)
  // This ensures transferred messages from previous owners still show on the homeowner side
  const messagesWithOwnership = messages.map((msg) => ({
    ...msg,
    isOwn: msg.senderId !== contractorId,
  }));

  const otherUser = {
    id: connection.contractor.id,
    name:
      connection.contractor.proProfile?.businessName ||
      connection.contractor.name ||
      connection.contractor.email ||
      "Contractor",
    image: connection.contractor.image,
  };

  const property = {
    address: connection.home.address,
    city: connection.home.city,
    state: connection.home.state,
  };

  const addrLine = [property.address, property.city, property.state]
    .filter(Boolean)
    .join(", ");

  return (
    <main className="relative min-h-screen text-white">
      <Bg />

      <div className="mx-auto max-w-7xl p-6 space-y-6">
        {/* Breadcrumb */}
        <ChatBreadcrumb
          homeId={homeId}
          homeAddress={addrLine}
          otherUserName={otherUser.name}
        />

        {/* Archived Banner */}
        {isArchived && (
          <div className="flex items-center gap-3 rounded-xl border border-gray-500/30 bg-gray-500/10 px-4 py-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400 flex-shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                This conversation is archived. You can view past messages but cannot send new ones.
              </p>
            </div>
            <Link
              href={`/home/${homeId}/contractors`}
              className="text-sm text-gray-400 hover:text-white transition-colors flex-shrink-0"
            >
              Manage contractors →
            </Link>
          </div>
        )}

        {/* Header w/ back arrow + contractor info */}
        <section className={glass}>
          <div className="flex items-center gap-3">
            <Link
              href={`/home/${homeId}/messages`}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-white/30 bg-white/10 hover:bg-white/15 transition-colors"
              aria-label="Back to messages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0 7.5-7.5M3 12h18"
                />
              </svg>
            </Link>

            {otherUser.image ? (
              <Image
                src={otherUser.image}
                alt={otherUser.name}
                width={40}
                height={40}
                className="rounded-full flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-medium">
                  {otherUser.name[0]?.toUpperCase() || "?"}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className={`text-lg font-semibold ${heading} truncate`}>
                  {otherUser.name}
                </h1>
                {isArchived && (
                  <span className="inline-block rounded-full bg-gray-500/20 px-2 py-0.5 text-xs text-gray-400 flex-shrink-0">
                    Archived
                  </span>
                )}
              </div>
              {addrLine && (
                <p className={`text-sm ${textMeta} truncate`}>{addrLine}</p>
              )}
            </div>
          </div>
        </section>

        {/* Messages thread */}
        <section
          className={`
            rounded-2xl border border-white/15
            bg-black/45 backdrop-blur-sm
            flex min-h-[60vh] flex-col overflow-hidden
            ${isArchived ? "opacity-90" : ""}
          `}
        >
          <div className="flex-1 min-h-[300px] overflow-hidden">
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

function Bg() {
  return (
    <div className="fixed inset-0 -z-50">
      <Image
        src="/myhomedox_home3.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_60%,rgba(0,0,0,0.45))]" />
    </div>
  );
}