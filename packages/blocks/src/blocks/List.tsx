import { SquareCheck } from "lucide-react";
import { Icon, ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

const LIST = "flex flex-col gap-3";
const ROW = "flex items-start gap-3";

export function List({ block }: { block: BlockOf<"list"> }) {
  if (block.style === "icon") {
    const rowDirection = block.iconPosition === "right" ? "flex-row-reverse" : "";
    return (
      <ul role="list" className={LIST}>
        {block.items.map((item, index) => (
          <li key={index} className={`${ROW} ${rowDirection}`}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary-tint text-primary-strong">
              <Icon name={item.icon} />
            </span>
            <span className="pt-1.5">
              <InlineText text={item.text} />
            </span>
          </li>
        ))}
      </ul>
    );
  }

  if (block.style === "numbered") {
    return (
      <ol role="list" className={LIST}>
        {block.items.map((item, index) => (
          <li key={index} className={ROW}>
            <span
              aria-hidden
              className="flex size-6 shrink-0 items-center justify-center rounded-pill bg-primary-strong text-small font-medium text-surface"
            >
              {index + 1}
            </span>
            <span>
              <InlineText text={item} />
            </span>
          </li>
        ))}
      </ol>
    );
  }

  const checklist = block.style === "checklist";
  return (
    <ul role="list" className={LIST}>
      {block.items.map((item, index) => (
        <li key={index} className={ROW}>
          {checklist ? (
            <SquareCheck
              size={20}
              strokeWidth={ICON_STROKE_WIDTH}
              aria-hidden
              className="mt-0.5 shrink-0 text-primary-strong"
            />
          ) : (
            <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-primary" />
          )}
          <span>
            <InlineText text={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}
