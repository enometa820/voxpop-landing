import {
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "../ui/utils";

/** 베벨 inset 한 줄 입력칸. */
export function RetroInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn("retro-field w-full px-3 py-2 font-mono text-[13px]", className)}
      {...props}
    />
  );
}

/** 베벨 inset 여러 줄 입력칸. */
export function RetroTextarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "retro-field w-full resize-none px-3 py-2 font-mono text-[13px] leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
