import { ArrowRight } from "lucide-react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

type Step = BlockOf<"timeline">["steps"][number];

function Dot({ number }: { number: number }) {
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-pill bg-primary-strong text-small font-medium text-surface"
    >
      {number}
    </span>
  );
}

function StepText({ step }: { step: Step }) {
  return (
    <>
      {step.label ? (
        <p className="text-caption text-ink-muted">
          <InlineText text={step.label} />
        </p>
      ) : null}
      <p className="font-medium">
        <InlineText text={step.title} />
      </p>
      <p className="mt-1">
        <InlineText text={step.text} />
      </p>
    </>
  );
}

export function Timeline({ block }: { block: BlockOf<"timeline"> }) {
  if (block.orientation === "horizontal") {
    return (
      <div>
        <div
          role="region"
          tabIndex={0}
          aria-label="Timeline (scrolls sideways)"
          className="overflow-x-auto snap-x snap-mandatory pb-2"
        >
          <ol role="list" className="flex w-max gap-4">
            {block.steps.map((step, index) => (
              <li
                key={index}
                className="w-64 shrink-0 snap-start rounded-card border border-border bg-surface p-5"
              >
                <div className="mb-3">
                  <Dot number={index + 1} />
                </div>
                <StepText step={step} />
              </li>
            ))}
          </ol>
        </div>
        {block.steps.length > 1 ? (
          <p className="mt-2 flex items-center gap-1 text-caption text-ink-muted">
            <ArrowRight size={16} strokeWidth={ICON_STROKE_WIDTH} aria-hidden />
            Scroll sideways to see all {block.steps.length} steps
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <ol role="list">
      {block.steps.map((step, index) => {
        const last = index === block.steps.length - 1;
        return (
          <li key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <Dot number={index + 1} />
              {last ? null : <span aria-hidden className="w-px flex-1 bg-border" />}
            </div>
            <div className={`min-w-0 ${last ? "" : "pb-6"}`}>
              <StepText step={step} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
