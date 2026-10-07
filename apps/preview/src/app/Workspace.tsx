import { useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { Divider } from "./Divider";

type Pane = "json" | "preview";

interface WorkspaceProps {
  editor: ReactNode;
  preview: ReactNode;
  ratio: number;
  onRatioChange: (ratio: number) => void;
  /** Which tab shows on narrow screens. */
  pane: Pane;
  onPaneChange: (pane: Pane) => void;
}

const TABS: { id: Pane; label: string }[] = [
  { id: "json", label: "JSON" },
  { id: "preview", label: "Preview" },
];

/**
 * Editor on the left, preview on the right, with a draggable divider.
 * Below 1024 px they become two tabs instead.
 */
export function Workspace({
  editor,
  preview,
  ratio,
  onRatioChange,
  pane,
  onPaneChange,
}: WorkspaceProps) {
  const container = useRef<HTMLDivElement>(null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const [, force] = useState(0);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? TABS.length - 1
          : (index + step + TABS.length) % TABS.length;
    const tab = TABS[next];
    if (tab) {
      onPaneChange(tab.id);
      tabs.current[next]?.focus();
      force((n) => n + 1);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        role="tablist"
        aria-label="Editor or preview"
        className="flex shrink-0 border-b border-border bg-surface lg:hidden"
      >
        {TABS.map((tab, index) => {
          const selected = pane === tab.id;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`pane-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onPaneChange(tab.id)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`-mb-px min-h-11 flex-1 border-b-2 px-4 font-medium ${selected ? "border-primary text-ink" : "border-transparent text-ink-muted"}`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div ref={container} className="flex min-h-0 flex-1">
        <div
          id="pane-json"
          role="tabpanel"
          aria-labelledby="tab-json"
          style={{ "--editor-width": `${ratio}%` } as React.CSSProperties}
          className={`${pane === "json" ? "flex" : "hidden"} min-h-0 min-w-0 flex-1 flex-col bg-surface lg:flex lg:w-(--editor-width) lg:flex-none`}
        >
          {editor}
        </div>
        <Divider ratio={ratio} onChange={onRatioChange} container={container} />
        <div
          id="pane-preview"
          role="tabpanel"
          aria-labelledby="tab-preview"
          className={`${pane === "preview" ? "block" : "hidden"} min-h-0 min-w-0 flex-1 overflow-auto bg-bg lg:block`}
        >
          {preview}
        </div>
      </div>
    </div>
  );
}
