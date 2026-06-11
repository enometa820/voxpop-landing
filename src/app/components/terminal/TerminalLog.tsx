import { useEffect, useState } from "react";
import { motion } from "motion/react";

export type LogLine = {
  kind: "cmd" | "progress" | "bullet" | "bar" | "plain" | "success";
  text: string;
};

const prefix: Record<LogLine["kind"], string> = {
  cmd: "$ ",
  progress: "→ ",
  bullet: "› ",
  bar: "",
  plain: "",
  success: "▲ ",
};

function lineColor(kind: LogLine["kind"]) {
  switch (kind) {
    case "cmd":
      return "text-foreground";
    case "progress":
      return "text-muted-foreground";
    case "success":
      return "text-primary";
    case "bar":
      return "text-accent";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Renders log lines that reveal one at a time (typed-in feel) with a
 * blinking cursor on the most recently revealed line.
 */
export function TerminalLog({
  lines,
  interval = 420,
  loop = false,
  className = "",
}: {
  lines: LogLine[];
  interval?: number;
  loop?: boolean;
  className?: string;
}) {
  const [visible, setVisible] = useState(1);

  useEffect(() => {
    if (visible >= lines.length) {
      if (!loop) return;
      const t = setTimeout(() => setVisible(1), 2600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setVisible((v) => v + 1), interval);
    return () => clearTimeout(t);
  }, [visible, lines.length, interval, loop]);

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.slice(0, visible).map((line, i) => (
        <motion.div
          key={`${i}-${line.text}`}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className={`whitespace-pre-wrap break-words ${lineColor(line.kind)}`}
        >
          <span className="select-none opacity-70">{prefix[line.kind]}</span>
          {line.text}
          {i === visible - 1 && (
            <span className="vox-cursor ml-0.5 text-primary">█</span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
