"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InviteProModal } from "@/app/home/[homeId]/invitations/_components/InviteProModal";

type ContractorActionsProps = {
  homeId: string;
  homeAddress: string;
};

export function ContractorActions({ homeId, homeAddress }: ContractorActionsProps) {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <>
      <Button type="button" onClick={() => setInviteModalOpen(true)}>
        + Invite a Pro
      </Button>

      <InviteProModal
        open={inviteModalOpen}
        onCloseAction={() => setInviteModalOpen(false)}
        homeId={homeId}
        homeAddress={homeAddress}
      />
    </>
  );
}