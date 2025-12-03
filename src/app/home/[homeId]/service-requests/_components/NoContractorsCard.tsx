// app/stats/[homeId]/service-requests/_components/NoContractorsCard.tsx
"use client";

import { useState } from "react";
import { glass, textMeta } from "@/lib/glass";
import { InviteProModal } from "@/app/home/[homeId]/invitations/_components/InviteProModal";

type NoContractorsCardProps = {
  homeId: string;
  homeAddress: string;
};

export function NoContractorsCard({ homeId, homeAddress }: NoContractorsCardProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <>
      <div className={`${glass} text-center`}>
        <div className="mb-4 text-6xl">🔨</div>
        <h2 className="mb-2 text-xl font-semibold">No Connected Contractors</h2>
        <p className={`mb-6 ${textMeta}`}>
          You need to connect with a contractor before you can request work.
        </p>
        <button
          type="button"
          onClick={() => setInviteOpen(true)}
          className="inline-block rounded-lg bg-[rgba(243,90,31,0.85)] px-6 py-3 font-medium text-white hover:bg-[rgba(243,90,31,0.95)]"
        >
          + Invite a Pro
        </button>
      </div>

      <InviteProModal
        open={inviteOpen}
        onCloseAction={() => setInviteOpen(false)}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </>
  );
}