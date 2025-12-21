"use client";

import { useCallback, useState } from "react";
import { glass, textMeta } from "@/lib/glass";
import { Button } from "@/components/ui/Button";
import { InviteProModal } from "@/app/home/[homeId]/invitations/_components/InviteProModal";

type NoContractorsCardProps = {
  homeId: string;
  homeAddress: string;
};

export function NoContractorsCard({ homeId, homeAddress }: NoContractorsCardProps) {
  const [inviteOpen, setInviteOpen] = useState(false);

  const openInvite = useCallback(() => setInviteOpen(true), []);
  const closeInvite = useCallback(() => setInviteOpen(false), []);

  return (
    <>
      <div className={`${glass} text-center`}>
        <div className="mb-4 text-6xl">🔨</div>
        <h2 className="mb-2 text-xl font-semibold">No Connected Contractors</h2>
        <p className={`mb-6 ${textMeta}`}>
          You need to connect with a contractor before you can request work.
        </p>

        <Button onClick={openInvite}>+ Invite a Pro</Button>
      </div>

      <InviteProModal
        open={inviteOpen}
        onCloseAction={closeInvite}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </>
  );
}