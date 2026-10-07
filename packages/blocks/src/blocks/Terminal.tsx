import { CopyButton } from "../ui/CopyButton";
import type { BlockOf } from "../types";

export function Terminal({ block }: { block: BlockOf<"terminal"> }) {
  const commands = block.lines.filter((line) => line.kind === "command").map((line) => line.text);
  const name = block.title ?? "Terminal";

  return (
    <figure className="overflow-hidden rounded-card border border-border bg-surface">
      <figcaption className="flex min-h-11 items-center justify-between gap-3 border-b border-border bg-bg pl-4">
        <span className="flex min-w-0 items-center gap-3">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-pill bg-border" />
            <span className="size-2.5 rounded-pill bg-border" />
            <span className="size-2.5 rounded-pill bg-border" />
          </span>
          {block.title ? (
            <span className="truncate text-small font-medium">{block.title}</span>
          ) : null}
        </span>
        {commands.length > 0 ? (
          <CopyButton text={commands.join("\n")} label="Copy commands" />
        ) : (
          <span />
        )}
      </figcaption>
      <div role="region" aria-label={name} tabIndex={0} className="overflow-x-auto p-4">
        <pre className="font-mono text-small">
          <code>
            {block.lines.map((line, index) =>
              line.kind === "command" ? (
                <span key={index} className="block">
                  <span className="sr-only">Command: </span>
                  <span aria-hidden className="select-none text-primary-strong">
                    ${" "}
                  </span>
                  {line.text}
                </span>
              ) : (
                <span key={index} className="block text-ink-muted">
                  <span className="sr-only">Output: </span>
                  {line.text}
                </span>
              ),
            )}
          </code>
        </pre>
      </div>
    </figure>
  );
}
