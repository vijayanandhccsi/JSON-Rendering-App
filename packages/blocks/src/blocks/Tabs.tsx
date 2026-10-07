import { useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { NestedBlocks } from "../renderer/BlockRenderer";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Tabs({ block }: { block: BlockOf<"tabs"> }) {
  const [active, setActive] = useState(0);
  const id = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const count = block.tabs.length;

  const select = (index: number) => {
    setActive(index);
    tabRefs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = {
      ArrowRight: (index + 1) % count,
      ArrowLeft: (index - 1 + count) % count,
      Home: 0,
      End: count - 1,
    }[event.key];
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  };

  return (
    <div>
      <div role="tablist" className="flex overflow-x-auto border-b border-border">
        {block.tabs.map((tab, index) => {
          const selected = index === active;
          return (
            <button
              key={index}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`${id}-tab-${index}`}
              aria-selected={selected}
              aria-controls={`${id}-panel-${index}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={`-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-4 py-2 font-medium transition-colors duration-150 ease-out ${
                selected
                  ? "border-primary text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <InlineText text={tab.label} />
            </button>
          );
        })}
      </div>
      {block.tabs.map((tab, index) => (
        <div
          key={index}
          role="tabpanel"
          id={`${id}-panel-${index}`}
          aria-labelledby={`${id}-tab-${index}`}
          tabIndex={0}
          hidden={index !== active}
          className="pt-4"
        >
          <NestedBlocks blocks={tab.blocks} />
        </div>
      ))}
    </div>
  );
}
