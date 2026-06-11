import { type ReactNode } from "react";

/**
 * A single grid cell bounded by thin 1px borders, with a subtle hover bg shift.
 * Compose multiple cells inside a bordered grid container.
 */
export function Cell({
  children,
  className = "",
  hover = true,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "section" | "li" | "a";
}) {
  return (
    <Tag
      className={`bg-card transition-colors duration-200 ${
        hover ? "hover:bg-surface-raised" : ""
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
