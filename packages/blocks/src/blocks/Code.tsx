import { Fragment } from "react";
import { useHighlight } from "../code/useHighlight";
import { CopyButton } from "../ui/CopyButton";
import type { BlockOf } from "../types";

export function Code({ block }: { block: BlockOf<"code"> }) {
  const lines = useHighlight(block.code, block.language);
  const plain = block.code.split("\n");
  const name = block.title ?? `${block.language} code`;

  return (
    <figure className="overflow-hidden rounded-card border border-border bg-surface">
      <figcaption className="flex min-h-11 items-center justify-between gap-3 border-b border-border bg-bg pl-4">
        <span className="flex min-w-0 items-center gap-3">
          {block.title ? (
            <span className="truncate text-small font-medium">{block.title}</span>
          ) : null}
          <span className="font-mono text-caption text-ink-muted">{block.language}</span>
        </span>
        <CopyButton text={block.code} label="Copy code" />
      </figcaption>
      <div role="region" aria-label={name} tabIndex={0} className="overflow-x-auto p-4">
        <pre className="font-mono text-small">
          <code>
            {lines
              ? lines.map((line, index) => (
                  <Fragment key={index}>
                    {index > 0 ? "\n" : null}
                    {line.map((token, tokenIndex) => (
                      <span key={tokenIndex} style={{ color: token.color }}>
                        {token.content}
                      </span>
                    ))}
                  </Fragment>
                ))
              : plain.join("\n")}
          </code>
        </pre>
      </div>
    </figure>
  );
}
