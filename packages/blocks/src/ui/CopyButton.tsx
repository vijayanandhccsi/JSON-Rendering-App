import { Check, Copy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ICON_STROKE_WIDTH } from "./Icon";

const RESET_AFTER_MS = 2000;

interface CopyButtonProps {
  text: string;
  /** Accessible name, for example "Copy code". */
  label: string;
}

export function CopyButton({ text, label }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), RESET_AFTER_MS);
    } catch {
      setCopied(false); // Clipboard blocked (for example on an insecure page): nothing to confirm.
    }
  };

  const Glyph = copied ? Check : Copy;
  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control text-ink-muted transition-colors duration-150 ease-out hover:bg-bg hover:text-ink"
      >
        <Glyph size={20} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
