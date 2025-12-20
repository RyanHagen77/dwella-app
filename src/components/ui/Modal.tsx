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

  /**
   * Optional override. If you pass this, it will replace the default sizing.
   * Example: "max-w-lg"
   */
  maxWidthClassName?: string;
};

const defaultPanelWidth =
  [
    "max-w-lg", // mobile + desktop default (your current standard)
    // tablet-only widen (md range), keep desktop unchanged
    "[@media(min-width:768px)_and_(max-width:1023px)]:max-w-2xl",
  ].join(" ");

export function Modal({
  open,
  title,
  children,
  onCloseAction,
  maxWidthClassName,
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

  const panelWidth = maxWidthClassName ?? defaultPanelWidth;

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
          panelWidth,
          "rounded-2xl border border-white/15 bg-black/80 p-6",
          "text-white shadow-2xl backdrop-blur-xl",
          // keep big forms sane on desktop
          "max-h-[calc(100vh-2rem)] overflow-auto",
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