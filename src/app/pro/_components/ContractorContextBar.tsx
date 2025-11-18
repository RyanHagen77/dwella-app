// src/app/pro/_components/ContractorContextBar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { glass, heading, textMeta } from "@/lib/glass";


export function ContractorContextBar() {
  const pathname = usePathname();
  const [connectsOpen, setConnectsOpen] = useState(false);

  const links = [
    { href: "/pro/contractor/dashboard", label: "Dashboard" },
    { href: "#connects", label: "Connects", modal: true },
    { href: "/pro/contractor/analytics", label: "Analytics" },
    { href: "/pro/contractor/profile", label: "Profile" },
  ];

  return (
    <>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-3 pb-2">
        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            if (link.modal) {
              return (
                <button
                  key="connects"
                  type="button"
                  onClick={() => setConnectsOpen(true)}
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs sm:text-sm text-white/85 hover:bg-white/20 backdrop-blur-sm"
                >
                  Connects
                </button>
              );
            }

            const isActive =
              pathname === link.href || pathname?.startsWith(link.href + "/");

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-3 py-1.5 text-xs sm:text-sm transition-colors border backdrop-blur-sm ${
                  isActive
                    ? "bg-white text-slate-900 border-white/80"
                    : "bg-black/35 border-white/30 text-white/85 hover:bg-black/55"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <ConnectsModal
        open={connectsOpen}
        onCloseAction={() => setConnectsOpen(false)}
      />
    </>
  );
}

/* ----------------- CONNECTS MODAL ----------------- */

function ConnectsModal({
  open,
  onCloseAction,
}: {
  open: boolean;
  onCloseAction: () => void;
}) {
  if (!open) return null;

  return (
    <Modal open={open} onCloseAction={onCloseAction}>
      <div className="p-6 md:p-7">
        <h2 className={`mb-2 text-xl font-bold text-white ${heading}`}>
          Connects
        </h2>
        <p className={`mb-6 text-sm ${textMeta}`}>
          Manage your invitations, connected homes, and documented work.
        </p>

        <div className="grid gap-6 md:grid-cols-[220px,1fr]">
          {/* Sidebar */}
          <div className="space-y-2">
            <NavItem
              href="/pro/contractor/work-records"
              title="Work Records"
              description="Documented work history."
              onClick={onCloseAction}
            />
            <NavItem
              href="/pro/contractor/work-requests"
              title="Work Requests"
              description="Requests from homeowners."
              onClick={onCloseAction}
            />
            <NavItem
              href="/pro/contractor/invitations"
              title="Invitations"
              description="Received & sent invites."
              onClick={onCloseAction}
            />
            <NavItem
              href="/pro/contractor/properties"
              title="Properties"
              description="Homes you're connected to."
              onClick={onCloseAction}
            />
          </div>

          {/* Right pane */}
          <div className="hidden md:block">
            <div
              className={`${glass} h-full rounded-2xl border border-white/10 bg-white/5 p-4`}
            >
              <p className="mb-1 text-sm font-semibold text-white">
                How Connects works
              </p>
              <p className={`text-sm ${textMeta}`}>
                <strong>Work Requests</strong> are jobs submitted by homeowners.
                <br />
                <br />
                <strong>Work Records</strong> keep shared history between you
                and a property.
                <br />
                <br />
                Use <strong>Invitations</strong> to form new connections, and
                manage all your active homes under <strong>Properties</strong>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onCloseAction}
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}

function NavItem({
  href,
  title,
  description,
  onClick,
}: {
  href: string;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm text-white hover:bg-white/10"
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-white/40">›</span>
      </div>
      <p className={`mt-1 text-xs ${textMeta}`}>{description}</p>
    </Link>
  );
}