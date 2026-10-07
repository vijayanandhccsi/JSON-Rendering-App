import { Icon } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

// Columns follow the width of the page column, not the screen, so they also work in narrow layouts.
const COLUMNS = {
  2: "@md:grid-cols-2",
  3: "@md:grid-cols-2 @2xl:grid-cols-3",
  4: "@md:grid-cols-2 @2xl:grid-cols-4",
} as const;

export function Grid({ block }: { block: BlockOf<"grid"> }) {
  return (
    <div className="@container">
      <ul role="list" className={`grid gap-4 ${COLUMNS[block.columns]}`}>
        {block.items.map((item, index) => (
          <li
            key={index}
            className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5"
          >
            {block.variant === "feature" && item.icon ? (
              <span className="flex size-12 items-center justify-center rounded-pill bg-primary-tint text-primary-strong">
                <Icon name={item.icon} size={24} />
              </span>
            ) : null}
            {item.badge ? (
              <span className="w-fit rounded-pill border border-border bg-primary-tint px-3 py-0.5 text-caption font-medium">
                <InlineText text={item.badge} />
              </span>
            ) : null}
            <p className="text-h4 font-semibold">
              <InlineText text={item.title} />
            </p>
            <p>
              <InlineText text={item.text} />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
