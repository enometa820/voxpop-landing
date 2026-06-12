import { type ButtonHTMLAttributes } from "react";
import { cn } from "../ui/utils";

type Variant = "default" | "primary" | "danger";

/** 베벨 outset 버튼 — 누르면 inset으로 눌리고 내용이 1px 밀린다. */
export function RetroButton({
  variant = "default",
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "retro-btn px-4 py-2 font-mono text-[13px]",
        variant === "primary" && "retro-btn--primary",
        variant === "danger" && "retro-btn--danger",
        className,
      )}
      {...props}
    >
      {/* 내부 래퍼 — :active 시 1px 눌림 이동 대상 */}
      <span className="inline-flex w-full items-center justify-center gap-1.5">
        {children}
      </span>
    </button>
  );
}
