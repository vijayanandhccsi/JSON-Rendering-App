import { ImageOff } from "lucide-react";
import { useId, useState } from "react";
import { ICON_STROKE_WIDTH } from "../ui/Icon";
import { useMediaUrl } from "../ui/MediaContext";
import { InlineText } from "../text/InlineText";
import type { BlockOf } from "../types";

export const IMAGE_WIDTH = { small: "max-w-80", medium: "max-w-140", full: "max-w-wide" } as const;

interface PictureProps {
  src: string;
  alt: string;
  description: string;
  className?: string;
}

/** An image from the media folder. A missing file shows a placeholder with the alt text and description. */
export function Picture({ src, alt, description, className = "" }: PictureProps) {
  const url = useMediaUrl()(src);
  const descriptionId = useId();
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        aria-describedby={descriptionId}
        className={`flex gap-3 rounded-card border border-dashed border-border bg-surface p-5 ${className}`}
      >
        <ImageOff
          size={24}
          strokeWidth={ICON_STROKE_WIDTH}
          aria-hidden
          className="shrink-0 text-ink-muted"
        />
        <div className="min-w-0">
          <p className="font-semibold">{alt}</p>
          <p id={descriptionId} className="text-small">
            {description}
          </p>
          <p className="mt-2 text-caption text-ink-muted">
            Image file not found: <span className="font-mono">{src}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <img
        src={url}
        alt={alt}
        aria-describedby={descriptionId}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`block h-auto w-full rounded-card border border-border ${className}`}
      />
      <span id={descriptionId} className="sr-only">
        {description}
      </span>
    </>
  );
}

export function Image({ block }: { block: BlockOf<"image"> }) {
  return (
    <figure className={`w-full ${IMAGE_WIDTH[block.size ?? "medium"]}`}>
      <Picture src={block.src} alt={block.alt} description={block.description} />
      {block.caption ? (
        <figcaption className="mt-2 text-caption text-ink-muted">
          <InlineText text={block.caption} />
        </figcaption>
      ) : null}
    </figure>
  );
}
