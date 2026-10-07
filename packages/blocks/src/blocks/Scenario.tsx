import { CircleCheck, CircleX } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { SECONDARY_BUTTON } from "../ui/buttons";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export function Scenario({ block }: { block: BlockOf<"scenario"> }) {
  const [chosen, setChosen] = useState<number | null>(null);
  const questionId = useId();
  const feedback = useRef<HTMLDivElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const answer = chosen === null ? null : block.options[chosen];

  // After choosing, move focus to the feedback so it is read straight away.
  useEffect(() => {
    if (chosen !== null) feedback.current?.focus();
  }, [chosen]);

  const tryAgain = () => {
    setChosen(null);
    firstOption.current?.focus();
  };

  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-surface p-5">
      <span className="w-fit rounded-pill border border-border bg-primary-tint px-3 py-0.5 text-caption font-medium">
        Scenario
      </span>
      <div>
        {block.title ? (
          <p className="text-h4 font-semibold">
            <InlineText text={block.title} />
          </p>
        ) : null}
        <p className={block.title ? "mt-1" : ""}>
          <InlineText text={block.situation} />
        </p>
      </div>
      <p id={questionId} className="font-semibold">
        <InlineText text={block.question} />
      </p>
      <div role="group" aria-labelledby={questionId} className="flex flex-col gap-2">
        {block.options.map((option, index) => {
          const isChosen = chosen === index;
          const locked = chosen !== null;
          const tone = isChosen
            ? option.correct
              ? "border-success bg-success-tint"
              : "border-danger bg-danger-tint"
            : "border-border bg-surface";
          return (
            <button
              key={index}
              ref={index === 0 ? firstOption : undefined}
              type="button"
              aria-disabled={locked && !isChosen}
              aria-pressed={isChosen}
              onClick={() => {
                if (!locked) setChosen(index);
              }}
              className={`flex min-h-11 w-full items-start gap-3 rounded-card border-2 p-4 text-left transition-colors duration-150 ease-out ${tone} ${
                locked ? (isChosen ? "" : "cursor-default opacity-70") : "hover:bg-bg"
              }`}
            >
              <span className="min-w-0 flex-1">
                <InlineText text={option.text} />
              </span>
              {isChosen ? (
                option.correct ? (
                  <CircleCheck
                    size={20}
                    strokeWidth={ICON_STROKE_WIDTH}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-success-strong"
                  />
                ) : (
                  <CircleX
                    size={20}
                    strokeWidth={ICON_STROKE_WIDTH}
                    aria-hidden
                    className="mt-0.5 shrink-0 text-danger"
                  />
                )
              ) : null}
            </button>
          );
        })}
      </div>
      <div ref={feedback} role="status" tabIndex={-1} className="outline-offset-4">
        {answer ? (
          <div
            className={`flex items-start gap-3 rounded-card p-4 ${answer.correct ? "bg-success-tint" : "bg-danger-tint"}`}
          >
            {answer.correct ? (
              <CircleCheck
                size={20}
                strokeWidth={ICON_STROKE_WIDTH}
                aria-hidden
                className="mt-0.5 shrink-0 text-success-strong"
              />
            ) : (
              <CircleX
                size={20}
                strokeWidth={ICON_STROKE_WIDTH}
                aria-hidden
                className="mt-0.5 shrink-0 text-danger"
              />
            )}
            <p>
              <span className="font-semibold">{answer.correct ? "Correct. " : "Not quite. "}</span>
              <InlineText text={answer.feedback} />
            </p>
          </div>
        ) : null}
      </div>
      {answer ? (
        <button type="button" className={`${SECONDARY_BUTTON} w-fit`} onClick={tryAgain}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
