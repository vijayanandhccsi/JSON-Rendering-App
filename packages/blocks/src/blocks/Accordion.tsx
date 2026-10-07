import { useState } from "react";
import { Disclosure } from "../ui/Disclosure";
import { NestedBlocks } from "../renderer/BlockRenderer";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Accordion({ block }: { block: BlockOf<"accordion"> }) {
  const [open, setOpen] = useState<ReadonlySet<number>>(new Set());

  const toggle = (index: number) =>
    setOpen((current) => {
      const next = new Set(current);
      if (!next.delete(index)) next.add(index);
      return next;
    });

  return (
    <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-surface">
      {block.items.map((item, index) => (
        <Disclosure
          key={index}
          title={<InlineText text={item.title} />}
          open={open.has(index)}
          onToggle={() => toggle(index)}
        >
          <NestedBlocks blocks={item.blocks} />
        </Disclosure>
      ))}
    </div>
  );
}
