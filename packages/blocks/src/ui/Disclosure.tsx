import { ChevronDown } from "lucide-react";
import { useId } from "react";
import type { ReactNode } from "react";
import { ICON_STROKE_WIDTH } from "./Icon";

interface DisclosureProps {
  title: ReactNode;
  open: boolean;
  onToggle: () => void;
  /** An icon shown before the title. */
  leading?: ReactNode;
  /** Extra classes for the header button, for example a tinted background. */
  headerClassName?: string;
  children: ReactNode;
}

/** A button that shows or hides a panel. Used by accordion rows and the expandable block. */
export function Disclosure({
  title,
  open,
  onToggle,
  leading,
  headerClassName = "",
  children,
}: DisclosureProps) {
  const id = useId();
  const buttonId = `${id}-button`;
  const panelId = `${id}-panel`;
  return (
    <div>
      <button
        type="button"
        id={buttonId}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
        className={`flex min-h-11 w-full items-center gap-3 px-5 py-3 text-left font-medium -outline-offset-2 transition-colors duration-150 ease-out hover:bg-bg ${headerClassName}`}
      >
        {leading}
        <span className="min-w-0 flex-1">{title}</span>
        <ChevronDown
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          aria-hidden
          className={`shrink-0 text-ink-muted transition-transform duration-200 ease-out ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div id={panelId} aria-labelledby={buttonId} hidden={!open} className="px-5 pb-5 pt-2">
        {children}
      </div>
    </div>
  );
}
