"use client";
import * as React from "react";
import { createPortal } from "react-dom";
import { ctaGhost } from "@/lib/glass";

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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onCloseAction}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-black/80 p-6 text-white shadow-2xl backdrop-blur-xl">
        {/* Header */}
        {(title || onCloseAction) && (
          <div className="mb-4 flex items-center justify-between">
            {title ? (
              <h2 className="text-lg font-semibold">{title}</h2>
            ) : (
              <span />
            )}

            <button
              type="button"
              onClick={onCloseAction}
              className={`${ctaGhost} text-sm`}
            >
              Close
            </button>
          </div>
        )}

        {children}
      </div>
    </div>,
    document.body
  );
}