import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

// Gap between blocks is 24 px, so the extra top margin is 40 - 24 for level 2 and 32 - 24 for level 3.
const STYLES = {
  2: "mt-4 text-h2 font-semibold",
  3: "mt-2 text-h3 font-semibold",
  4: "text-h4 font-semibold",
} as const;

export function Heading({ block }: { block: BlockOf<"heading"> }) {
  const Tag = `h${block.level}` as const;
  return (
    <Tag className={STYLES[block.level]}>
      <InlineText text={block.text} />
    </Tag>
  );
}
