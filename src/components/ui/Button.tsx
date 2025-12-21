"use client";
import * as React from "react";
import { ctaPrimary, ctaGhost } from "@/lib/glass";
import { foggyApprove, foggyReject, foggyNeutral } from "@/components/ui/foggyButtons";

type Size = "sm" | "md";
type Variant = "primary" | "ghost" | "foggyApprove" | "foggyReject" | "quiet" | "neutral";

type ButtonBase = {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
};

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> &
  ButtonBase & { asChild: true; href: string };

type NativeButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonBase & { asChild?: false | undefined };

type Props = AnchorProps | NativeButtonProps;

const base = "inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0";
const sizeMap: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
};

// ✅ “quiet” button used in forms (Upload photos, etc.)
const quietButton =
  "inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 " +
  "transition-colors hover:bg-white/15 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variantMap: Record<Variant, string> = {
  primary: ctaPrimary,
  ghost: ctaGhost,
  foggyApprove,
  foggyReject,
  quiet: quietButton,
  neutral: foggyNeutral,
};

function isAnchorProps(p: Props): p is AnchorProps {
  return (p as AnchorProps).asChild === true;
}

export function Button(props: Props) {
  const {
    variant = "primary",
    size = "md",
    fullWidth = false,
    className = "",
    children,
  } = props;

  const variantClass = variantMap[variant];
  const needsSize = variant === "primary" || variant === "ghost" || variant === "neutral";

  const classes = [
    base,
    fullWidth ? "w-full" : "",
    needsSize ? sizeMap[size] : "",
    variantClass,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (isAnchorProps(props)) {
    const { href, target, rel, ...aRest } = props;
    return (
      <a href={href} target={target} rel={rel} className={classes} {...aRest}>
        {children}
      </a>
    );
  }

  const { type, ...btnRest } = props as React.ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={type ?? "button"} className={classes} {...btnRest}>
      {children}
    </button>
  );
}

export function GhostButton(
  props: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    size?: Size;
    className?: string;
    fullWidth?: boolean;
  }
) {
  const { className = "", size = "md", fullWidth = false, type, ...rest } = props;
  const classes = [base, fullWidth ? "w-full" : "", sizeMap[size], ctaGhost, className]
    .filter(Boolean)
    .join(" ");
  return <button type={type ?? "button"} className={classes} {...rest} />;
}