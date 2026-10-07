import { Table2 } from "lucide-react";
import { useId } from "react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

const PORT = /^\d{1,5}([-/,]\s?\d{1,5})*(\/(tcp|udp))?$/i;
const COMMAND = /^[a-z][\w.-]*(\s+[^\s]+)+$/;

/** Cells that look like a port or a command are shown in the mono font. */
export function looksLikeCode(value: string): boolean {
  const text = value.trim();
  return PORT.test(text) || COMMAND.test(text);
}

export function Smartsheet({ block }: { block: BlockOf<"smartsheet"> }) {
  const titleId = useId();
  const mono = block.rows.every((row) => looksLikeCode(row[0] ?? ""));

  return (
    <div>
      {block.title ? (
        <p id={titleId} className="mb-3 flex items-center gap-2 font-semibold">
          <Table2
            size={20}
            strokeWidth={ICON_STROKE_WIDTH}
            aria-hidden
            className="text-primary-strong"
          />
          <InlineText text={block.title} />
        </p>
      ) : null}
      <div
        role="region"
        tabIndex={0}
        aria-label={block.title ? undefined : "Table"}
        aria-labelledby={block.title ? titleId : undefined}
        className="overflow-x-auto rounded-card border border-border bg-surface"
      >
        <table className="w-full border-collapse text-left text-small">
          <thead className="bg-bg">
            <tr>
              {block.headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 font-semibold ${index === 0 ? "sticky left-0 bg-bg" : ""}`}
                >
                  <InlineText text={header} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-t border-border">
                {row.map((cell, cellIndex) =>
                  cellIndex === 0 ? (
                    <th
                      key={cellIndex}
                      scope="row"
                      className={`sticky left-0 whitespace-nowrap bg-surface px-4 py-3 text-left font-normal ${mono ? "font-mono" : ""}`}
                    >
                      <InlineText text={cell} />
                    </th>
                  ) : (
                    <td key={cellIndex} className="px-4 py-3 align-top">
                      <InlineText text={cell} />
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
