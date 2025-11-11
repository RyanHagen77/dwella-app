"use client";
import * as React from "react";
import { createPortal } from "react-dom";

export type ModalProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onCloseAction: () => void;
};

export function Modal({ open, title, children, onCloseAction }: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 z-0 bg-black/60" onClick={onCloseAction} />
      <div className="relative z-[10000] w-full max-w-lg rounded-2xl border border-white/30 bg-gray-800 p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-start justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onCloseAction}
            className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm hover:bg-white/15"
          >
            Close
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>,
    document.body
  );
}