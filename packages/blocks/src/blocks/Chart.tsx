import { TriangleAlert } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { buildChartOption, chartHeight } from "../chart/options";
import { chartDataTable } from "../chart/dataTable";
import { readChartTokens } from "../chart/tokens";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { usePrefersReducedMotion } from "../ui/usePrefersReducedMotion";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

type ChartBlock = BlockOf<"chart">;

function Card({ block, children }: { block: ChartBlock; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-3 rounded-card border border-border bg-surface p-5">
      <figcaption>
        <p className="text-h4 font-semibold">
          <InlineText text={block.title} />
        </p>
        {block.note ? (
          <p className="text-caption text-ink-muted">
            <InlineText text={block.note} />
          </p>
        ) : null}
      </figcaption>
      {children}
    </figure>
  );
}

/** Shown instead of a blank box when a chart cannot be drawn. It says what is wrong and how to fix it. */
function ChartError({
  block,
  reasons,
}: {
  block: ChartBlock;
  reasons: { message: string; fix?: string }[];
}) {
  return (
    <Card block={block}>
      <div role="alert" className="flex gap-3 rounded-control bg-danger-tint p-4">
        <TriangleAlert
          size={20}
          strokeWidth={ICON_STROKE_WIDTH}
          aria-hidden
          className="mt-0.5 shrink-0 text-danger"
        />
        <div className="min-w-0">
          <p className="font-semibold">This chart cannot be drawn.</p>
          <ul role="list" className="mt-1 flex flex-col gap-1 text-small">
            {reasons.map((reason, index) => (
              <li key={index}>
                {reason.message}
                {reason.fix ? ` ${reason.fix}` : ""}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Card>
  );
}

type Reason = { message: string; fix?: string };

/**
 * Draws the chart. The chart library and the data check are both loaded the first time a page has a
 * chart, so pages without charts never download them.
 */
export function Chart({ block }: { block: ChartBlock }) {
  const target = useRef<HTMLDivElement>(null);
  const descriptionId = useId();
  const reducedMotion = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);
  const [problems, setProblems] = useState<Reason[]>([]);
  // A chart with a type or data the library cannot read has no table; the check below explains why.
  const table = useMemo(() => {
    try {
      return chartDataTable(block) ?? { headers: [], rows: [] };
    } catch {
      return { headers: [], rows: [] };
    }
  }, [block]);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    setReady(false);
    setProblems([]);

    Promise.all([import("../validate"), import("../chart/echarts-setup")])
      .then(([{ validateBlockValue }, { init }]) => {
        const element = target.current;
        if (cancelled || !element) return;

        // Data that does not match the chart type gets a clear message instead of a blank box.
        const errors = validateBlockValue(block).filter((issue) => issue.severity === "error");
        if (errors.length > 0) {
          setProblems(errors.map((issue) => ({ message: issue.message, fix: issue.fix })));
          return;
        }

        const chart = init(element, undefined, { renderer: "svg" });
        const observer = new ResizeObserver(() => chart.resize());
        observer.observe(element);
        dispose = () => {
          observer.disconnect();
          chart.dispose();
        };
        chart.setOption(
          buildChartOption(block, { tokens: readChartTokens(), animate: !reducedMotion }),
        );
        setReady(true);
      })
      .catch((cause: unknown) => {
        // Drawing failed part way: release whatever was created before showing the error.
        dispose?.();
        dispose = undefined;
        if (!cancelled) {
          setProblems([
            {
              message: `The chart library reported: ${cause instanceof Error ? cause.message : String(cause)}.`,
              fix: "Check the chart data in the JSON.",
            },
          ]);
        }
      });

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [block, reducedMotion]);

  if (problems.length > 0) return <ChartError block={block} reasons={problems} />;

  return (
    <Card block={block}>
      <div className="relative">
        <div
          ref={target}
          role="img"
          aria-label={block.title}
          aria-describedby={descriptionId}
          className="w-full"
          style={{ height: chartHeight(block) }}
        />
        {ready ? null : (
          <p className="absolute inset-0 flex items-center justify-center text-small text-ink-muted">
            Loading chart
          </p>
        )}
      </div>
      <p id={descriptionId} className="sr-only">
        {block.description}
      </p>
      <table className="sr-only">
        <caption>{block.title}: data</caption>
        <thead>
          <tr>
            {table.headers.map((header, index) => (
              <th key={index} scope="col">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) =>
                cellIndex === 0 ? (
                  <th key={cellIndex} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={cellIndex}>{cell}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
