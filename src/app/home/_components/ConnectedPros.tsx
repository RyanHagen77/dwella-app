"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { glass, ctaPrimary, heading } from "@/lib/glass";
import { InviteProModal } from "@/app/home/[homeId]/invitations/_components/InviteProModal";

type ConnectionWithContractor = {
  id: string;
  createdAt: Date;
  verifiedServiceCount: number;
  contractor: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    proProfile: {
      businessName: string | null;
    } | null;
  };
};

type ConnectedProsProps = {
  homeId: string;
  homeAddress: string;
  connections: ConnectionWithContractor[];
};

export function ConnectedPros({ homeId, homeAddress, connections }: ConnectedProsProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      <div className={glass}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-lg font-semibold ${heading}`}>
            Your Trusted Pros ({connections.length})
          </h2>
          <Link
            href={`/home/${homeId}/contractors`}
            className="text-sm text-white/70 hover:text-white transition"
          >
            Manage →
          </Link>
        </div>

        {connections.length === 0 ? (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3">👷</div>
            <p className="text-white/70 mb-2">No connected contractors yet</p>
            <p className="text-sm text-white/50 mb-4">
              Connect with pros who&apos;ve worked on your home
            </p>
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className={`${ctaPrimary} text-sm`}
            >
              + Invite a Contractor
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {connections.map((conn) => (
              <ContractorCard key={conn.id} connection={conn} homeId={homeId} />
            ))}

            {/* Add More Card */}
            <button
              type="button"
              onClick={() => setInviteModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-4 text-white/60 hover:border-white/40 hover:bg-white/10 hover:text-white transition min-h-[80px]"
            >
              <span className="text-xl">+</span>
              <span className="text-sm font-medium">Invite a Pro</span>
            </button>
          </div>
        )}
      </div>

      <InviteProModal
        open={inviteModalOpen}
        onCloseAction={() => setInviteModalOpen(false)}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </>
  );
}

function ContractorCard({
  connection,
  homeId,
}: {
  connection: ConnectionWithContractor;
  homeId: string;
}) {
  const contractor = connection.contractor;
  const displayName = contractor.proProfile?.businessName || contractor.name || contractor.email;
  const initials = (displayName || "C")[0].toUpperCase();

  return (
    <Link
      href={`/home/${homeId}/contractors/${connection.id}`}
      className="flex items-center gap-3 rounded-xl bg-white/5 border border-white/10 p-3 hover:bg-white/10 hover:border-white/20 transition"
    >
      {contractor.image ? (
        <Image
          src={contractor.image}
          alt={displayName}
          width={40}
          height={40}
          className="rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold flex-shrink-0">
          {initials}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white truncate">{displayName}</p>
        {connection.verifiedServiceCount > 0 ? (
          <p className="text-xs text-green-400">
            ✓ {connection.verifiedServiceCount} verified service
            {connection.verifiedServiceCount !== 1 ? "s" : ""}
          </p>
        ) : (
          <p className="text-xs text-white/50">Connected</p>
        )}
      </div>

      <span className="text-white/40 flex-shrink-0">→</span>
    </Link>
  );
}