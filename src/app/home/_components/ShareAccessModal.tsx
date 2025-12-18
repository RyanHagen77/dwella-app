"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui";
import { Button, GhostButton } from "@/components/ui/Button";
import { InviteSchema, type InviteInput } from "@/lib/validators";
import { uid, loadJSON, saveJSON } from "@/lib/storage";
import { useToast } from "@/components/ui/Toast";
import { glass, textMeta, tableGlass } from "@/lib/glass";

type Invite = {
  id: string;
  email: string;
  role: "Viewer" | "Contributor";
  link: string;
  createdAt: string;
};

type ShareAccessModalProps = {
  open: boolean;
  onCloseAction: () => void;
  homeId?: string;
};

export function ShareAccessModal({
  open,
  onCloseAction: onClose,
  homeId,
}: ShareAccessModalProps) {
  const { push } = useToast();

  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<InviteInput["role"]>("Viewer");
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [origin, setOrigin] = React.useState<string>("");

  // Capture origin safely on client
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

  React.useEffect(() => {
    setInvites(loadJSON<Invite[]>("invites", []));
  }, []);

  React.useEffect(() => {
    saveJSON("invites", invites);
  }, [invites]);

  function addInvite() {
    const parsed = InviteSchema.safeParse({ email, role });
    if (!parsed.success) {
      push("Enter a valid email");
      return;
    }

    if (!origin) {
      // extremely edge-case, but keeps it safe
      push("Unable to generate link yet. Please try again.");
      return;
    }

    const token = uid();
    const params = new URLSearchParams({ token });
    if (homeId) params.set("home", homeId);

    const link = `${origin}/report?${params.toString()}`;

    const inv: Invite = {
      id: uid(),
      email: parsed.data.email,
      role: parsed.data.role,
      link,
      createdAt: new Date().toISOString(),
    };

    setInvites((x) => [inv, ...x]);
    setEmail("");
    push("Invite created");
  }

  function removeInvite(id: string) {
    setInvites((x) => x.filter((i) => i.id !== id));
    push("Access revoked");
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Access">
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Input
            placeholder="name@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Invite email"
          />

          <Select
            value={role}
            onChange={(e) => setRole(e.target.value as InviteInput["role"])}
            aria-label="Invite role"
          >
            <option value="Viewer">Viewer</option>
            <option value="Contributor">Contributor</option>
          </Select>

          <Button type="button" onClick={addInvite}>
            Generate Link
          </Button>
        </div>

        <p className={`text-sm ${textMeta}`}>
          Share the generated link with your realtor or contractor. You can revoke access anytime.
        </p>

        <div className={tableGlass}>
          <table className="w-full text-sm">
            <thead className="bg-white/10 text-white">
              <tr>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Link</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {invites.map((i) => (
                <tr key={i.id}>
                  <td className="p-2 text-white/85">{i.email}</td>
                  <td className="p-2 text-white/85">{i.role}</td>
                  <td className="p-2">
                    <a className="break-all underline text-white" href={i.link}>
                      {i.link}
                    </a>
                  </td>
                  <td className="p-2 text-right">
                    <GhostButton size="sm" onClick={() => removeInvite(i.id)}>
                      Revoke
                    </GhostButton>
                  </td>
                </tr>
              ))}

              {invites.length === 0 && (
                <tr>
                  <td className="p-4 text-white/70" colSpan={4}>
                    No shared access yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={`${glass} !p-3`}>
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/55">
            Tip
          </div>
          <p className="text-sm text-white/85">
            Use “Viewer” for buyers/agents; “Contributor” for your contractor to upload receipts.
          </p>
        </div>
      </div>
    </Modal>
  );
}