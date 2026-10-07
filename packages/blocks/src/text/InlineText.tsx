import type { ReactNode } from "react";
import { parseInline } from "./parseInline";
import type { InlineNode } from "./parseInline";

function render(nodes: InlineNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    switch (node.kind) {
      case "text":
        return node.value;
      case "code":
        return (
          <code key={index} className="rounded-sm bg-bg px-1.5 py-0.5 font-mono text-small">
            {node.value}
          </code>
        );
      case "bold":
        return (
          <strong key={index} className="font-semibold">
            {render(node.children)}
          </strong>
        );
      case "italic":
        return <em key={index}>{render(node.children)}</em>;
    }
  });
}

/** Plain text with **bold**, *italic* and `code`. Never renders HTML. */
export function InlineText({ text }: { text: string }) {
  return <>{render(parseInline(text))}</>;
}
