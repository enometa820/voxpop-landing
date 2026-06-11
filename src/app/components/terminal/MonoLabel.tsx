import { type ReactNode } from "react";

/**
 * Small monospace label device, e.g. [ 01 ] · // · $ · ›
 */
export function MonoLabel({
  children,
  bracket = false,
  className = "",
}: {
  children: ReactNode;
  bracket?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`font-mono uppercase tracking-[0.18em] text-[11px] text-muted-foreground ${className}`}
    >
      {bracket ? <>[ {children} ]</> : children}
    </span>
  );
}
