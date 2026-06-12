import { type ButtonHTMLAttributes } from "react";
import { cn } from "../ui/utils";

type Variant = "default" | "primary" | "danger";

/** 베벨 outset 버튼 — 누르면 inset으로 눌리고 내용이 1px 밀린다. cta=주요 행동(크게·굵게). */
export function RetroButton({
  variant = "default", cta = false, className, children, type = "button", ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; cta?: boolean }) {
  return (
    <button
      type={type}
      className={cn(
        "retro-btn px-4 py-2 font-mono",
        cta ? "retro-btn--cta text-body-lg font-bold py-3" : "text-body",
        variant === "primary" && "retro-btn--primary",
        variant === "danger" && "retro-btn--danger",
        className,
      )}
      {...props}
    >
      <span className="inline-flex w-full items-center justify-center gap-1.5">{children}</span>
    </button>
  );
}
