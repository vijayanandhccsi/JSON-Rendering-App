import { ChevronsLeftRight } from "lucide-react";
import { useId, useState } from "react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { useMediaUrl } from "../ui/MediaContext";
import type { BlockOf } from "../types";
import { Picture } from "./Image";

const PILL =
  "absolute top-3 rounded-pill border border-border bg-surface px-3 py-1 text-caption font-medium text-ink";

export function BeforeAfter({ block }: { block: BlockOf<"beforeafter"> }) {
  const mediaUrl = useMediaUrl();
  const id = useId();
  const [position, setPosition] = useState(50);
  const [failed, setFailed] = useState(false);
  const { before, after } = block;
  const beforeLabel = before.label ?? "Before";
  const afterLabel = after.label ?? "After";

  // If a file is missing, show both images as separate placeholders instead of a broken slider.
  if (failed) {
    return (
      <div className="flex flex-col gap-4">
        {[before, after].map((image, index) => (
          <figure key={index}>
            <figcaption className="mb-2 text-small font-medium">
              {image.label ?? (index === 0 ? "Before" : "After")}
            </figcaption>
            <Picture src={image.src} alt={image.alt} description={image.description} />
          </figure>
        ))}
      </div>
    );
  }

  return (
    <figure className="relative select-none overflow-hidden rounded-card border border-border">
      <img
        src={mediaUrl(after.src)}
        alt={after.alt}
        aria-describedby={`${id}-after`}
        onError={() => setFailed(true)}
        className="block h-auto w-full"
      />
      <img
        src={mediaUrl(before.src)}
        alt={before.alt}
        aria-describedby={`${id}-before`}
        onError={() => setFailed(true)}
        className="absolute inset-0 size-full object-cover"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />
      <span id={`${id}-before`} className="sr-only">
        {before.description}
      </span>
      <span id={`${id}-after`} className="sr-only">
        {after.description}
      </span>

      {/* The range input covers the whole image: it handles mouse, touch and keyboard. */}
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={position}
        onChange={(event) => setPosition(Number(event.target.value))}
        aria-label={`Comparison slider: ${beforeLabel} on the left, ${afterLabel} on the right`}
        aria-valuetext={`${position}% ${beforeLabel}, ${100 - position}% ${afterLabel}`}
        className="peer absolute inset-0 z-10 size-full cursor-ew-resize touch-pan-y opacity-0"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-surface"
        style={{ left: `${position}%` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-pill border border-border bg-surface text-ink shadow-raised peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary"
        style={{ left: `${position}%` }}
      >
        <ChevronsLeftRight size={20} strokeWidth={ICON_STROKE_WIDTH} />
      </span>
      <span aria-hidden className={`${PILL} left-3`}>
        {beforeLabel}
      </span>
      <span aria-hidden className={`${PILL} right-3`}>
        {afterLabel}
      </span>
    </figure>
  );
}
