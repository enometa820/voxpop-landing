import { useState } from "react";

/**
 * [ copy ] mono button. Copies the given text to the clipboard.
 */
export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* clipboard may be unavailable in the preview sandbox */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };

  return (
    <button
      type="button"
      onClick={onCopy}
      className="shrink-0 rounded-md border border-border bg-card px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-surface-raised hover:text-primary"
    >
      [ {copied ? "copied" : "copy"} ]
    </button>
  );
}
