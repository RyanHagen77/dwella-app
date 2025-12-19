// src/components/ui/Modal.tsx
"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ctaGhost } from "@/lib/glass";

export type ModalProps = {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onCloseAction: () => void;
  maxWidthClassName?: string; // optional override (rarely needed)
};

export function Modal({
  open,
  title,
  children,
  onCloseAction,
  maxWidthClassName = "max-w-lg",
}: ModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // ESC to close
  React.useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseAction();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCloseAction]);

  // Lock body scroll while open
  React.useEffect(() => {
    if (!open) return;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 cursor-default bg-black/60"
        onClick={onCloseAction}
      />

      {/* Panel */}
      <div
        className={[
          "relative w-full",
          maxWidthClassName,
          "rounded-2xl border border-white/15 bg-black/80 p-6",
          "text-white shadow-2xl backdrop-blur-xl",
        ].join(" ")}
      >
        {/* Header */}
        {title ? (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{title}</h2>

            <button
              type="button"
              onClick={onCloseAction}
              className={`${ctaGhost} text-sm`}
            >
              Close
            </button>
          </div>
        ) : (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              onClick={onCloseAction}
              className={`${ctaGhost} text-sm`}
            >
              Close
            </button>
          </div>
        )}

        {/* Content */}
        {children}
      </div>
    </div>,
    document.body
  );
}