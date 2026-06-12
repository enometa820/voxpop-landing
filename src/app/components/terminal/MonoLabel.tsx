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
      className={`font-mono uppercase tracking-[0.18em] whitespace-nowrap text-caption text-muted-foreground ${className}`}
    >
      {bracket ? <>[ {children} ]</> : children}
    </span>
  );
}
